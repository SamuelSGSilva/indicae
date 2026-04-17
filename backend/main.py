from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
import models, schemas, database
from neo4j_provider import neo4j_db
from fastapi.middleware.cors import CORSMiddleware
from gemini_ai import get_intention_embedding
import requests
import httpx
import socket
import os
import base64
import time
import secrets
import datetime
from collections import defaultdict
from dotenv import load_dotenv
import resend
from models import PasswordResetToken, UserProject

# ── Rate limiter simples em memória ──
_rate_store: dict = defaultdict(list)
_RATE_LIMIT = 20
_RATE_WINDOW = 60

def check_rate_limit(request: Request, limit: int = _RATE_LIMIT):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    timestamps = [t for t in _rate_store[ip] if now - t < _RATE_WINDOW]
    timestamps.append(now)
    _rate_store[ip] = timestamps
    if len(timestamps) > limit:
        raise HTTPException(status_code=429, detail="Muitas requisições. Aguarde um momento.")

_original_getaddrinfo = socket.getaddrinfo
GITHUB_IPS = {
    "github.com": "140.82.112.4",
    "api.github.com": "140.82.112.5"
}

def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host in GITHUB_IPS:
        return _original_getaddrinfo(GITHUB_IPS[host], port, family, type, proto, flags)
    return _original_getaddrinfo(host, port, family, type, proto, flags)

socket.getaddrinfo = patched_getaddrinfo

def _github_client() -> httpx.Client:
    transport = httpx.HTTPTransport(retries=2)
    return httpx.Client(
        trust_env=False,
        verify=True,
        timeout=15.0,
        transport=transport,
    )

load_dotenv(override=True)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

resend.api_key = os.getenv("RESEND_API_KEY", "")

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Indicae API",
    description="Motor de Recomendação e API Principal para o MVP do Indicae.",
    version="1.0.0",
)

_CORS_ORIGINS = [
    FRONTEND_URL,
    "http://127.0.0.1:4455", "http://localhost:4455",
    "http://localhost:3000", "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Indicae. O Motor está online."}

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

def fetch_github_stats(username: str) -> dict:
    """Returns public_repos count and total stars for a GitHub user."""
    try:
        headers = {"Accept": "application/vnd.github+json"}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        with _github_client() as client:
            user_resp = client.get(f"https://api.github.com/users/{username}", headers=headers)
        if user_resp.status_code != 200:
            return {"repos": 0, "stars": 0}
        user_data = user_resp.json()
        public_repos = user_data.get("public_repos", 0)
        with _github_client() as client:
            repos_resp = client.get(
                f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated",
                headers=headers
            )
        stars = 0
        if repos_resp.status_code == 200:
            stars = sum(r.get("stargazers_count", 0) for r in repos_resp.json())
        return {"repos": public_repos, "stars": stars}
    except Exception:
        return {"repos": 0, "stars": 0}


def fetch_github_skills(username: str):
    try:
        headers = {"Accept": "application/vnd.github+json"}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=30"
        with _github_client() as client:
            response = client.get(url, headers=headers)
        if response.status_code != 200:
            print(f"GitHub API erro {response.status_code} para {username}")
            return []
        repos = response.json()
        languages = set()
        for r in repos:
            if r.get("language"):
                languages.add(r["language"])
            lang_url = r.get("languages_url", "")
            if lang_url:
                try:
                    with _github_client() as client:
                        lang_resp = client.get(lang_url, headers=headers)
                    if lang_resp.status_code == 200:
                        for lang in lang_resp.json().keys():
                            languages.add(lang)
                except Exception:
                    pass
        return list(languages)
    except Exception as e:
        print(f"Erro integracao Github: {e}")
    return []


def fetch_github_repos(username: str) -> list[dict]:
    try:
        headers = {"Accept": "application/vnd.github+json"}
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        with _github_client() as client:
            resp = client.get(
                f"https://api.github.com/users/{username}/repos?sort=updated&per_page=30",
                headers=headers
            )
        if resp.status_code != 200:
            return []
        repos = resp.json()
        result = []
        for r in repos:
            if r.get("fork"):
                continue  # skip forks
            topics = r.get("topics") or []
            lang = r.get("language")
            tech_parts = ([lang] if lang else []) + topics
            tech_stack = ", ".join(tech_parts[:8]) if tech_parts else None
            result.append({
                "title": r.get("name", ""),
                "description": (r.get("description") or "")[:500],
                "url": r.get("html_url", ""),
                "tech_stack": tech_stack,
            })
        return result
    except Exception:
        return []


@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(req: Request, user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    check_rate_limit(req, limit=5)
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado.")
    import bcrypt
    hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    safe_name = user.name.strip()[:150]
    safe_bio = (user.bio or "").strip()[:1000]
    safe_github = (user.github_username or "").strip().lstrip("@")[:100]
    if user.role not in ("b2c", "mentor", "b2b"):
        raise HTTPException(status_code=400, detail="Perfil inválido.")
    new_user = models.User(
        name=safe_name,
        email=user.email.strip().lower(),
        hashed_password=hashed_password,
        role=user.role,
        github_username=safe_github or None,
        bio=safe_bio
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    github_skills = []
    if new_user.github_username:
        github_skills = fetch_github_skills(new_user.github_username)
    for skill_name in github_skills:
        existing = db.query(models.UserSkill).filter(
            models.UserSkill.user_id == new_user.id,
            models.UserSkill.skill_name == skill_name.lower()
        ).first()
        if not existing:
            db.add(models.UserSkill(user_id=new_user.id, skill_name=skill_name.lower(), source="github"))
    db.commit()
    query = """
    MERGE (u:User {id: $id})
    SET u.email = $email, u.name = $name, u.role = $role, u.github = $github, u.bio = $bio
    WITH u
    FOREACH (skill_name IN $skills |
        MERGE (s:Skill {name: toLower(skill_name)})
        MERGE (u)-[:HAS_SKILL]->(s)
    )
    RETURN u
    """
    try:
        neo4j_db.query(query, parameters={
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
            "github": new_user.github_username or "",
            "bio": new_user.bio or "",
            "skills": github_skills
        })
    except Exception as e:
        print(f"Erro ao salvar no Neo4J: {str(e)}")
    try:
        db.add(models.Activity(
            actor_id=new_user.id,
            target_user_id=None,
            event_type="user_joined",
            skill_name=None,
        ))
        db.commit()
    except Exception as e:
        print(f"Erro ao criar activity user_joined: {e}")
    return new_user


@app.post("/api/login")
def login(req: Request, request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    check_rate_limit(req, limit=10)
    import bcrypt
    db_user = db.query(models.User).filter(models.User.email == request.email.strip().lower()).first()
    dummy_hash = "$2b$12$AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    check_hash = db_user.hashed_password if db_user else dummy_hash
    try:
        password_ok = bcrypt.checkpw(request.password.encode("utf-8"), check_hash.encode("utf-8"))
    except Exception:
        password_ok = False
    if not db_user or not password_ok:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return {"message": "Sucesso", "user_id": db_user.id, "name": db_user.name}


@app.get("/api/users/{user_id}/profile", response_model=schemas.UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    query_skills = """
    MATCH (u:User {id: $id})
    OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
    OPTIONAL MATCH ()-[v:VALIDATED]->(u)
    OPTIONAL MATCH (u)-[:IS_SEEKING]->(i:Intention)
    OPTIONAL MATCH (u)-[out_v:VALIDATED]->()
    RETURN
        collect(DISTINCT s.name) AS skills,
        sum(v.weight) AS trust_score,
        collect(DISTINCT i.text) AS intentions,
        count(out_v) AS validations_given
    """
    skills = []
    trust_score = 0
    intentions = []
    validations_given = 0
    try:
        results = neo4j_db.query(query_skills, parameters={"id": user_id})
        if results:
            record = dict(results[0])
            skills = record.get("skills", [])
            trust_score = record.get("trust_score", 0)
            intentions = record.get("intentions", [])
            validations_given = record.get("validations_given", 0)
            skills = [s for s in skills if s]
            intentions = [i for i in intentions if i]
    except Exception:
        pass
    if not skills:
        sql_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == user_id).all()
        skills = [s.skill_name for s in sql_skills]
    if trust_score == 0:
        validations_received = db.query(models.Validation).filter(
            models.Validation.target_user_id == user_id
        ).all()
        trust_score = sum(v.weight for v in validations_received)
        validations_given = db.query(models.Validation).filter(
            models.Validation.validator_id == user_id
        ).count()
    # --- Trust Dimensions ---
    # Social score: sum of validation weights received (capped at 50)
    social_score = min(int(trust_score or 0), 50)

    # GitHub score: repos + stars (capped at 50)
    github_score = 0
    if db_user.github_username:
        gh_stats = fetch_github_stats(db_user.github_username)
        github_score = min(gh_stats["repos"] * 2 + gh_stats["stars"], 50)

    # Activity score: days on platform + intentions set + validations given (capped at 50)
    import datetime as dt
    days_on_platform = 0
    if db_user.created_at:
        now = dt.datetime.now(dt.timezone.utc)
        created = db_user.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=dt.timezone.utc)
        days_on_platform = (now - created).days
    activity_score = min(
        min(days_on_platform // 7, 20) +          # up to 20 pts: 1pt per week
        min(len(intentions) * 5, 15) +            # up to 15 pts: 5pt per intention
        min(int(validations_given) * 3, 15),      # up to 15 pts: 3pt per validation given
        50
    )

    total_trust = social_score + github_score + activity_score

    badges = []
    if social_score > 0:
        badges.append({"icon": "🛡️", "name": "Membro Verificado", "desc": "Recebeu confiança da rede"})
    if total_trust >= 50:
        badges.append({"icon": "⭐", "name": "Talento de Ouro", "desc": f"Autoridade máxima ({total_trust} pts)"})
    if len(skills) >= 5:
        badges.append({"icon": "🐙", "name": "Poliglota Tech", "desc": f"Domina {len(skills)} tecnologias"})
    if validations_given > 0:
        badges.append({"icon": "🤝", "name": "Pilar da Comunidade", "desc": "Fortaleceu a rede apoiando colegas"})
    if github_score >= 20:
        badges.append({"icon": "🐱", "name": "GitHub Power User", "desc": "Alto impacto no GitHub"})
    projects = db.query(UserProject).filter(UserProject.user_id == user_id).order_by(UserProject.created_at.desc()).all()
    return {
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "role": db_user.role,
        "github_username": db_user.github_username,
        "bio": db_user.bio,
        "avatar_url": db_user.avatar_url or "",
        "trust_score": total_trust,
        "trust_dimensions": {
            "github": github_score,
            "social": social_score,
            "activity": activity_score,
        },
        "skills": skills,
        "intentions": intentions,
        "badges": badges,
        "projects": projects,
    }


@app.get("/api/users/{user_id}/projects", response_model=List[schemas.ProjectResponse])
def get_projects(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(UserProject).filter(UserProject.user_id == user_id).order_by(UserProject.created_at.desc()).all()


@app.post("/api/users/{user_id}/projects", response_model=schemas.ProjectResponse)
def create_project(user_id: int, data: schemas.ProjectCreate, db: Session = Depends(database.get_db)):
    project = UserProject(user_id=user_id, **data.dict())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.put("/api/users/{user_id}/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project(user_id: int, project_id: int, data: schemas.ProjectCreate, db: Session = Depends(database.get_db)):
    project = db.query(UserProject).filter(UserProject.id == project_id, UserProject.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return project


@app.delete("/api/users/{user_id}/projects/{project_id}")
def delete_project(user_id: int, project_id: int, db: Session = Depends(database.get_db)):
    project = db.query(UserProject).filter(UserProject.id == project_id, UserProject.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}


@app.post("/api/users/{user_id}/sync-skills")
def sync_github_skills(user_id: int, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if not db_user.github_username:
        raise HTTPException(status_code=400, detail="Usuário não possui username do GitHub cadastrado.")
    github_skills = fetch_github_skills(db_user.github_username)
    if not github_skills:
        return {"message": "Nenhuma skill encontrada no GitHub.", "skills": []}
    added = []
    for skill_name in github_skills:
        existing = db.query(models.UserSkill).filter(
            models.UserSkill.user_id == user_id,
            models.UserSkill.skill_name == skill_name.lower()
        ).first()
        if not existing:
            db.add(models.UserSkill(user_id=user_id, skill_name=skill_name.lower(), source="github"))
            added.append(skill_name)
    db.commit()
    try:
        query = """
        MATCH (u:User {id: $id})
        FOREACH (skill_name IN $skills |
            MERGE (s:Skill {name: toLower(skill_name)})
            MERGE (u)-[:HAS_SKILL]->(s)
        )
        """
        neo4j_db.query(query, parameters={"id": user_id, "skills": github_skills})
    except Exception:
        pass
    all_skills = [s.skill_name for s in db.query(models.UserSkill).filter(models.UserSkill.user_id == user_id).all()]
    return {"message": f"Skills sincronizadas com sucesso! {len(added)} novas encontradas.", "skills": all_skills}


@app.post("/api/users/{user_id}/sync-projects")
def sync_github_projects(user_id: int, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if not db_user.github_username:
        raise HTTPException(status_code=400, detail="Usuário não possui username do GitHub cadastrado.")
    repos = fetch_github_repos(db_user.github_username)
    if not repos:
        return {"message": "Nenhum repositório encontrado.", "projects": []}
    added = []
    for repo in repos:
        existing = db.query(models.UserProject).filter(
            models.UserProject.user_id == user_id,
            models.UserProject.url == repo["url"]
        ).first()
        if existing:
            # update description/tech_stack in case they changed
            existing.description = repo["description"]
            existing.tech_stack = repo["tech_stack"]
        else:
            project = models.UserProject(
                user_id=user_id,
                source="github",
                **repo
            )
            db.add(project)
            added.append(project)
    db.commit()
    return {"message": f"{len(added)} projeto(s) importado(s).", "count": len(added)}


@app.put("/api/users/{user_id}/profile")
def update_user_profile(user_id: int, request: schemas.UserUpdateRequest, db: Session = Depends(database.get_db)):
    if request.name is not None and len(request.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nome muito curto.")
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if request.name is not None:
        db_user.name = request.name.strip()[:150]
    if request.bio is not None:
        db_user.bio = request.bio.strip()[:1000]
    db.commit()
    db.refresh(db_user)
    query = """
    MATCH (u:User {id: $id})
    SET u.name = $name, u.bio = $bio
    RETURN u
    """
    try:
        neo4j_db.query(query, parameters={
            "id": user_id,
            "name": db_user.name,
            "bio": db_user.bio
        })
    except Exception as e:
        print(f"Aviso: Erro ao sincronizar Neo4j: {e}")
    return {"message": "Perfil sincronizado e atualizado nas Duas Dimensões!"}


@app.get("/api/analytics/trends")
def b2b_market_trends():
    query_skills = """
    MATCH (s:Skill)<-[:HAS_SKILL]-()
    RETURN s.name AS name, count(*) AS value
    ORDER BY value DESC LIMIT 8
    """
    query_alphas = """
    MATCH (u:User)<-[v:VALIDATED]-()
    RETURN u.name AS name, count(v) AS validations, sum(v.weight) AS trust
    ORDER BY trust DESC LIMIT 5
    """
    try:
        skills_res = neo4j_db.query(query_skills, parameters={})
        alphas_res = neo4j_db.query(query_alphas, parameters={})
        top_skills = [{"name": r["name"].title(), "value": r["value"]} for r in skills_res] if skills_res else []
        top_alphas = [{"name": r["name"], "validations": r["validations"], "trust": r["trust"]} for r in alphas_res] if alphas_res else []
        if top_skills or top_alphas:
            return {"top_skills": top_skills, "top_alphas": top_alphas}
        raise Exception("Neo4j vazio")
    except Exception:
        pass
    from sqlalchemy import func as sqlfunc
    from sqlalchemy.orm import Session as _S
    db: _S = next(database.get_db())
    try:
        skill_counts = db.query(
            models.Validation.skill_name,
            sqlfunc.count(models.Validation.id).label("value")
        ).group_by(models.Validation.skill_name).order_by(sqlfunc.count(models.Validation.id).desc()).limit(8).all()
        if not skill_counts:
            skill_counts = db.query(
                models.UserSkill.skill_name,
                sqlfunc.count(models.UserSkill.id).label("value")
            ).group_by(models.UserSkill.skill_name).order_by(sqlfunc.count(models.UserSkill.id).desc()).limit(8).all()
        top_skills = [{"name": r.skill_name.title(), "value": r.value} for r in skill_counts]
        alpha_counts = db.query(
            models.User.name,
            sqlfunc.count(models.Validation.id).label("validations"),
            sqlfunc.sum(models.Validation.weight).label("trust")
        ).join(models.Validation, models.Validation.target_user_id == models.User.id) \
         .group_by(models.User.id, models.User.name) \
         .order_by(sqlfunc.sum(models.Validation.weight).desc()).limit(5).all()
        top_alphas = [{"name": r.name, "validations": r.validations, "trust": int(r.trust or 0)} for r in alpha_counts]
        return {"top_skills": top_skills, "top_alphas": top_alphas}
    finally:
        db.close()


@app.get("/api/network/users")
def get_all_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    feed = []
    for u in users:
        query_skills = "MATCH (user:User {id: $uid})-[:HAS_SKILL]->(s:Skill) RETURN s.name AS skill"
        try:
            res = neo4j_db.query(query_skills, parameters={"uid": u.id})
            user_skills = [r["skill"] for r in res] if res else []
        except:
            user_skills = []
        if not user_skills:
            sql_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == u.id).all()
            user_skills = [s.skill_name for s in sql_skills]
        feed.append({
            "id_referencia": u.id,
            "nome": u.name,
            "motivo": u.bio or "Disponível para receber upvotes na malha neural.",
            "fit": f"{len(user_skills)} Skills",
            "skills": user_skills
        })
    return {"matches": feed}


@app.get("/api/auth/github/login")
def github_login(bio: str = ""):
    state = base64.b64encode(bio.encode()).decode()
    redirect_uri = f"{BACKEND_URL}/api/auth/github/callback"
    github_url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={redirect_uri}&scope=read:user,user:email&state={state}"
    return RedirectResponse(github_url)


@app.get("/api/auth/github/callback")
def github_callback(code: str, state: str = "", db: Session = Depends(database.get_db)):
    try:
        try:
            bio = base64.b64decode(state + "==").decode("utf-8", errors="ignore")
        except Exception:
            bio = ""
        with _github_client() as client:
            token_res = client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                print(f"GitHub token failed: {token_data}")
                return RedirectResponse(f"{FRONTEND_URL}/login?error=github_token_failed")
            user_res = client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            gh_user = user_res.json()
            gh_email = gh_user.get("email")
            if not gh_email:
                try:
                    emails_res = client.get(
                        "https://api.github.com/user/emails",
                        headers={"Authorization": f"Bearer {access_token}"},
                    )
                    emails = emails_res.json()
                    primary = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)
                    gh_email = primary or (emails[0]["email"] if emails else None)
                except Exception:
                    pass
        gh_username = gh_user.get("login", "")
        gh_name = gh_user.get("name") or gh_username
        if not gh_email:
            gh_email = f"{gh_username}@users.noreply.github.com"
        import uuid
        db_user = (
            db.query(models.User).filter(models.User.github_username == gh_username).first()
            or db.query(models.User).filter(models.User.email == gh_email).first()
        )
        gh_avatar = gh_user.get("avatar_url", "")
        if db_user:
            db_user.github_username = gh_username
            if not db_user.name or db_user.name == db_user.email.split("@")[0]:
                db_user.name = gh_name
            # Salva avatar do GitHub se o usuário ainda não tem foto personalizada
            if gh_avatar and not db_user.avatar_url:
                db_user.avatar_url = gh_avatar
            db.commit()
        else:
            db_user = models.User(
                name=gh_name,
                email=gh_email,
                hashed_password=str(uuid.uuid4()),
                role="b2c",
                github_username=gh_username,
                bio=bio,
                avatar_url=gh_avatar or None,
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        github_skills = fetch_github_skills(gh_username)
        for skill_name in github_skills:
            exists = db.query(models.UserSkill).filter(
                models.UserSkill.user_id == db_user.id,
                models.UserSkill.skill_name == skill_name.lower(),
            ).first()
            if not exists:
                db.add(models.UserSkill(user_id=db_user.id, skill_name=skill_name.lower(), source="github"))
        db.commit()
        try:
            query = """
            MERGE (u:User {id: $id})
            SET u.email = $email, u.name = $name, u.role = $role, u.github = $github, u.bio = $bio
            WITH u
            FOREACH (skill_name IN $skills |
                MERGE (s:Skill {name: toLower(skill_name)})
                MERGE (u)-[:HAS_SKILL]->(s)
            )
            RETURN u
            """
            neo4j_db.query(query, parameters={
                "id": db_user.id, "email": db_user.email, "name": db_user.name,
                "role": db_user.role, "github": gh_username, "bio": bio,
                "skills": github_skills,
            })
        except Exception as neo_err:
            print(f"Neo4j warning (nao critico): {neo_err}")
        return RedirectResponse(f"{FRONTEND_URL}/?user_id={db_user.id}&user_name={db_user.name}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erro no GitHub OAuth: {str(e)}")
        return RedirectResponse(f"{FRONTEND_URL}/login?error=github_crash")


@app.get("/api/auth/google/login")
def google_login():
    if not GOOGLE_CLIENT_ID:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_not_configured")
    redirect_uri = f"{BACKEND_URL}/api/auth/google/callback"
    google_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
        "&prompt=select_account"
    )
    return RedirectResponse(google_url)


@app.get("/api/auth/google/callback")
def google_callback(code: str, db: Session = Depends(database.get_db)):
    try:
        redirect_uri = f"{BACKEND_URL}/api/auth/google/callback"
        token_res = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
            timeout=15.0,
            verify=False,
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            print(f"Google token failed: {token_data}")
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_token_failed")
        user_res = httpx.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15.0,
            verify=False,
        )
        g_user = user_res.json()
        g_email = g_user.get("email")
        g_name = g_user.get("name") or (g_email.split("@")[0] if g_email else "Usuario")
        g_avatar = g_user.get("picture", "")
        if not g_email:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_no_email")
        import uuid
        db_user = db.query(models.User).filter(models.User.email == g_email).first()
        if db_user:
            if not db_user.name:
                db_user.name = g_name
            # Salva avatar do Google se o usuário ainda não tem foto personalizada
            if g_avatar and not db_user.avatar_url:
                db_user.avatar_url = g_avatar
            db.commit()
        else:
            db_user = models.User(
                name=g_name,
                email=g_email,
                hashed_password=str(uuid.uuid4()),
                role="b2c",
                github_username=None,
                bio="",
                avatar_url=g_avatar or None,
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        return RedirectResponse(f"{FRONTEND_URL}/?user_id={db_user.id}&user_name={db_user.name}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erro no Google OAuth: {str(e)}")
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_crash")


@app.post("/api/auth/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(database.get_db)):
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email obrigatório")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return {"message": "Se este email estiver cadastrado, você receberá um link em breve."}
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == False
    ).update({"used": True})
    token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()
    reset_link = f"{FRONTEND_URL}/redefinir-senha?token={token}"
    try:
        resend.Emails.send({
            "from": "Indicae <no-reply@indicae.com.br>",
            "to": [user.email],
            "subject": "Redefinição de senha — Indicae",
            "html": f"""
            <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
              <h2 style="color:#7c3aed">Redefinir sua senha</h2>
              <p>Olá, <strong>{user.name}</strong>!</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta no Indicae.</p>
              <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
              <a href="{reset_link}"
                 style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;
                        border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                Redefinir Senha
              </a>
              <p style="color:#888;font-size:13px">
                Se você não solicitou isso, ignore este email. Sua senha permanece a mesma.
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="color:#bbb;font-size:12px">Indicae — Plataforma de talentos tech</p>
            </div>
            """
        })
    except Exception as e:
        print(f"Erro ao enviar email Resend: {e}")
    return {"message": "Se este email estiver cadastrado, você receberá um link em breve."}


@app.get("/api/auth/reset-password/validate")
def validate_reset_token(token: str, db: Session = Depends(database.get_db)):
    reset = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == token,
        models.PasswordResetToken.used == False
    ).first()
    if not reset:
        raise HTTPException(status_code=400, detail="Link inválido ou expirado")
    if reset.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Link expirado. Solicite um novo.")
    return {"valid": True}


@app.post("/api/auth/reset-password")
def reset_password(payload: dict, db: Session = Depends(database.get_db)):
    token = payload.get("token", "")
    new_password = payload.get("password", "")
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token e senha são obrigatórios")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 8 caracteres")
    reset = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == token,
        models.PasswordResetToken.used == False
    ).first()
    if not reset:
        raise HTTPException(status_code=400, detail="Link inválido ou já utilizado")
    if reset.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Link expirado. Solicite um novo.")
    import bcrypt
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    db.query(models.User).filter(models.User.id == reset.user_id).update({"hashed_password": hashed})
    reset.used = True
    db.commit()
    return {"message": "Senha redefinida com sucesso!"}


@app.put("/api/users/{user_id}/avatar")
def update_avatar(user_id: int, payload: dict, db: Session = Depends(database.get_db)):
    """Atualiza foto de perfil. Aceita URL externa ou base64 (upload direto)."""
    avatar = payload.get("avatar_url", "").strip()
    if not avatar:
        raise HTTPException(status_code=400, detail="URL ou imagem obrigatória.")
    # Limite de 2MB para base64
    if avatar.startswith("data:image") and len(avatar) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagem muito grande. Máximo 2MB.")
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    db_user.avatar_url = avatar
    db.commit()
    return {"message": "Foto atualizada com sucesso!", "avatar_url": avatar}


@app.get("/api/search")
def search_users(q: str = "", db: Session = Depends(database.get_db)):
    from sqlalchemy import func as sqlfunc
    q = q.strip()[:100]
    if len(q) < 2:
        return {"results": []}
    by_name = db.query(models.User).filter(
        models.User.name.ilike(f"%{q}%")
    ).limit(20).all()
    name_ids = {u.id for u in by_name}
    skill_user_ids = db.query(models.UserSkill.user_id).filter(
        models.UserSkill.skill_name.ilike(f"%{q.lower()}%")
    ).union(
        db.query(models.Validation.target_user_id).filter(
            models.Validation.skill_name.ilike(f"%{q.lower()}%")
        )
    ).all()
    skill_ids = {row[0] for row in skill_user_ids} - name_ids
    by_skill = db.query(models.User).filter(
        models.User.id.in_(skill_ids)
    ).limit(20).all() if skill_ids else []
    all_users = (by_name + by_skill)[:20]
    results = []
    for u in all_users:
        skills = [s.skill_name for s in db.query(models.UserSkill).filter(
            models.UserSkill.user_id == u.id
        ).limit(8).all()]
        trust = db.query(sqlfunc.sum(models.Validation.weight)).filter(
            models.Validation.target_user_id == u.id
        ).scalar() or 0
        results.append({
            "id": u.id,
            "name": u.name,
            "bio": u.bio or "",
            "role": u.role,
            "github_username": u.github_username or "",
            "skills": skills,
            "trust_score": int(trust),
        })
    return {"results": results}


@app.get("/api/notifications/{user_id}")
def get_notifications(user_id: int, db: Session = Depends(database.get_db)):
    notifs = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id)
        .order_by(models.Notification.created_at.desc())
        .limit(30)
        .all()
    )
    unread_count = sum(1 for n in notifs if n.read == 0)
    return {
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "read": n.read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ],
        "unread_count": unread_count,
    }


@app.put("/api/notifications/read-all/{user_id}")
def mark_all_read(user_id: int, db: Session = Depends(database.get_db)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.read == 0
    ).update({"read": 1})
    db.commit()
    return {"ok": True}


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(database.get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")
    notif.read = 1
    db.commit()
    return {"ok": True}


@app.post("/api/network/validate")
def validate_skill(validation: schemas.ValidationCreate, db: Session = Depends(database.get_db)):
    skill_clean = validation.skill_name.strip().lower()[:100]
    if not skill_clean:
        raise HTTPException(status_code=400, detail="Nome da skill inválido.")
    weight_safe = max(1, min(int(validation.weight or 1), 10))
    db_validation = models.Validation(
        validator_id=validation.validator_id,
        target_user_id=validation.target_user_id,
        skill_name=skill_clean,
        weight=weight_safe,
    )
    db.add(db_validation)
    db.commit()
    try:
        actor = db.query(models.User).filter(models.User.id == validation.validator_id).first()
        actor_name = actor.name if actor else "Alguém"
        notif = models.Notification(
            user_id=validation.target_user_id,
            actor_id=validation.validator_id,
            type="skill_support",
            message=f"{actor_name} apoiou sua habilidade em {skill_clean.title()}! 👍",
            read=0,
        )
        db.add(notif)
        db.add(models.Activity(
            actor_id=validation.validator_id,
            target_user_id=validation.target_user_id,
            event_type="skill_validation",
            skill_name=skill_clean,
        ))
        db.commit()
    except Exception as e:
        print(f"Erro ao criar notificacao: {e}")
    query = """
    MATCH (v:User {id: $validator_id})
    MATCH (t:User {id: $target_id})
    MERGE (s:Skill {name: toLower($skill_name)})
    MERGE (t)-[:HAS_SKILL]->(s)
    MERGE (v)-[r:VALIDATED {weight: $weight}]->(t)
    RETURN v, r, t, s
    """
    try:
        neo4j_db.query(query, parameters={
            "validator_id": validation.validator_id,
            "target_id": validation.target_user_id,
            "skill_name": validation.skill_name,
            "weight": validation.weight
        })
    except Exception:
        pass
    return {"message": f"Você acabou de apoiar a habilidade {validation.skill_name}!"}


@app.get("/api/b2b/search")
def b2b_talent_search(skill: str):
    query = """
    MATCH (u:User)-[:HAS_SKILL]->(s:Skill {name: toLower($target_skill)})
    OPTIONAL MATCH ()-[v:VALIDATED]->(u)
    RETURN
        u.id AS id,
        u.name AS nome,
        u.email AS contato,
        u.bio AS bio,
        sum(v.weight) AS confianca
    ORDER BY confianca DESC
    LIMIT 20
    """
    try:
        results = neo4j_db.query(query, parameters={"target_skill": skill})
        talents = [dict(r) for r in results]
        if talents:
            return {"talents": talents}
        raise Exception("Neo4j vazio")
    except Exception:
        pass
    from sqlalchemy import func as sqlfunc
    from sqlalchemy.orm import Session as _S
    db: _S = next(database.get_db())
    try:
        skill_lower = skill.strip().lower()
        all_ids = db.query(models.UserSkill.user_id).filter(
            models.UserSkill.skill_name.ilike(f"%{skill_lower}%")
        ).union(
            db.query(models.Validation.target_user_id).filter(
                models.Validation.skill_name.ilike(f"%{skill_lower}%")
            )
        ).subquery()
        users = db.query(models.User).filter(models.User.id.in_(all_ids)).all()
        talents = []
        for u in users:
            trust = db.query(sqlfunc.sum(models.Validation.weight)).filter(
                models.Validation.target_user_id == u.id
            ).scalar() or 0
            talents.append({
                "id": u.id, "nome": u.name, "contato": u.email,
                "bio": u.bio or "", "confianca": int(trust)
            })
        talents.sort(key=lambda x: x["confianca"], reverse=True)
        return {"talents": talents[:20]}
    finally:
        db.close()


@app.post("/api/b2b/cultural-fit")
def analyze_cultural_fit(fit_req: schemas.CulturalFitRequest, db: Session = Depends(database.get_db)):
    candidates = db.query(models.User).filter(models.User.id.in_(fit_req.candidates_ids)).all()
    if not candidates:
        raise HTTPException(status_code=404, detail="Nenhum candidato encontrado")
    cands_data = []
    for c in candidates:
        bio_texto = c.bio if c.bio else "Este candidato optou por não descrever um estilo de trabalho."
        cands_data.append(f"[Candidato ID: {c.id}] Bio/Visão do Candidato: {bio_texto}")
    prompt = f"""
    Você é um Recrutador Estratégico Especialista em Cultura Organizacional do Indicae (Vaga B2B).
    Sua missão é ler o Cenário e Cultura da Empresa atual, ler o perfil (bio) dos candidatos e devolver um JSON avaliando se há Fit Cultural.

    ## CENÁRIO DA EMPRESA:
    {fit_req.culture_context}

    ## PERFIS DE CANDIDATOS:
    {" | ".join(cands_data)}

    ## REGRA OBRIGATÓRIA:
    Responda apenas com um Objeto JSON puro (sem marcação Markdown como ```json) neste formato:
    {{
       "resultados": [
          {{ "id": ID_DO_CANDIDATO, "porcentagem": 85, "motivo": "frase muito curta com justificativa impactante" }}
       ]
    }}
    Seja analítico.
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        json_text = response.text.strip().replace("```json", "").replace("```", "")
        import json
        resultado = json.loads(json_text)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de Análise Gemini: {str(e)}")


@app.get("/api/network/visualize")
def visualize_network():
    query = """
    MATCH (n)-[r]->(m)
    RETURN
      id(n) AS source_id, labels(n)[0] AS source_label, coalesce(n.name, n.text, toString(n.id)) AS source_name,
      type(r) AS rel_type, r.weight AS rel_weight,
      id(m) AS target_id, labels(m)[0] AS target_label, coalesce(m.name, m.text, toString(m.id)) AS target_name
    LIMIT 300
    """
    try:
        results = neo4j_db.query(query)
        nodes_dict = {}
        links = []
        for record in results:
            s_id = str(record["source_id"])
            t_id = str(record["target_id"])
            if s_id not in nodes_dict:
                nodes_dict[s_id] = {"id": s_id, "label": record["source_label"], "name": record["source_name"]}
            if t_id not in nodes_dict:
                nodes_dict[t_id] = {"id": t_id, "label": record["target_label"], "name": record["target_name"]}
            links.append({"source": s_id, "target": t_id, "label": record["rel_type"], "weight": record.get("rel_weight") or 1})
        nodes = list(nodes_dict.values())
        if nodes:
            return {"nodes": nodes, "links": links}
        raise Exception("Neo4j vazio")
    except Exception:
        pass
    from sqlalchemy.orm import Session as _Session
    db: _Session = next(database.get_db())
    try:
        users = db.query(models.User).all()
        validations = db.query(models.Validation).all()
        skills_map: dict = {}
        nodes_dict = {}
        links = []
        for u in users:
            nodes_dict[f"u{u.id}"] = {"id": f"u{u.id}", "label": "User", "name": u.name}
        skill_counter = 0
        for v in validations:
            skill_key = v.skill_name.lower()
            if skill_key not in skills_map:
                skill_counter += 1
                sid = f"s{skill_counter}"
                skills_map[skill_key] = sid
                nodes_dict[sid] = {"id": sid, "label": "Skill", "name": v.skill_name}
            sid = skills_map[skill_key]
            links.append({"source": f"u{v.target_user_id}", "target": sid, "label": "HAS_SKILL", "weight": 1})
            links.append({"source": f"u{v.validator_id}", "target": f"u{v.target_user_id}", "label": "APOIOU", "weight": v.weight})
        return {"nodes": list(nodes_dict.values()), "links": links}
    finally:
        db.close()


@app.post("/api/intentions")
def log_intention(intention: schemas.IntentionCreate, db: Session = Depends(database.get_db)):
    embedding_vector = get_intention_embedding(intention.intent_text)
    new_intention = models.Intention(
        user_id=intention.user_id,
        text=intention.intent_text,
        embedding=embedding_vector
    )
    db.add(new_intention)
    db.commit()
    try:
        db.add(models.Activity(
            actor_id=intention.user_id,
            target_user_id=None,
            event_type="intention_created",
            skill_name=None,
        ))
        db.commit()
    except Exception as e:
        print(f"Erro ao criar activity intention_created: {e}")
    query = """
    MATCH (u:User {id: $user_id})
    MERGE (i:Intention {text: toLower($intent_text)})
    MERGE (u)-[:IS_SEEKING]->(i)
    RETURN u, i
    """
    try:
        neo4j_db.query(query, parameters={
            "user_id": intention.user_id,
            "intent_text": intention.intent_text,
        })
        return {"message": "Sua intenção foi lida pela I.A e gravada nas duas inteligências do Indicae!"}
    except Exception as e:
        return {"message": "Sua intenção foi registrada com sucesso!"}


@app.get("/api/activities/feed", response_model=List[schemas.ActivityResponse])
def get_activity_feed(limit: int = 30, offset: int = 0, db: Session = Depends(database.get_db)):
    activities = (
        db.query(models.Activity)
        .options(
            joinedload(models.Activity.actor),
            joinedload(models.Activity.target_user),
        )
        .order_by(models.Activity.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    result = []
    for a in activities:
        if not a.actor:
            continue
        result.append(schemas.ActivityResponse(
            id=a.id,
            event_type=a.event_type,
            skill_name=a.skill_name,
            created_at=a.created_at,
            actor=schemas.ActivityActor(
                id=a.actor.id,
                name=a.actor.name,
                avatar_url=a.actor.avatar_url,
            ),
            target_user=schemas.ActivityActor(
                id=a.target_user.id,
                name=a.target_user.name,
                avatar_url=a.target_user.avatar_url,
            ) if a.target_user else None,
        ))
    return result


@app.get("/api/match/{user_id}")
def find_match(user_id: int, db: Session = Depends(database.get_db)):
    user_latest_intent = db.query(models.Intention).filter(
        models.Intention.user_id == user_id
    ).order_by(models.Intention.created_at.desc()).first()
    if not user_latest_intent:
        return {"matches": []}
    similar_intentions = db.query(
        models.Intention,
        models.User
    ).join(models.User).filter(
        models.Intention.user_id != user_id
    ).order_by(
        models.Intention.embedding.cosine_distance(user_latest_intent.embedding)
    ).limit(5).all()
    matches = []
    for intent, user in similar_intentions:
        matches.append({
            "Nome": user.name,
            "Contato": user.email,
            "Motivo": intent.text,
            "Fit": "Alta Afinidade Neural (IA)"
        })
    return {"matches": matches}


@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    """
    Exclui o cadastro do usuário e todos os seus dados associados (conformidade LGPD).
    Remove: intenções, skills, validações emitidas/recebidas, notificações e o próprio usuário.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Remove intenções (têm embedding — devem ser deletadas antes do usuário)
    db.query(models.Intention).filter(models.Intention.user_id == user_id).delete()

    # Remove skills
    db.query(models.UserSkill).filter(models.UserSkill.user_id == user_id).delete()

    # Remove validações emitidas e recebidas
    db.query(models.Validation).filter(
        (models.Validation.validator_id == user_id) |
        (models.Validation.target_user_id == user_id)
    ).delete()

    # Remove notificações recebidas e geradas pelo usuário
    db.query(models.Notification).filter(
        (models.Notification.user_id == user_id) |
        (models.Notification.actor_id == user_id)
    ).delete()

    # Remove tokens de redefinição de senha
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user_id
    ).delete()

    # Remove o nó do Neo4j (se existir)
    try:
        if neo4j_db:
            neo4j_db.query(
                "MATCH (u:User {id: $id}) DETACH DELETE u",
                parameters={"id": user_id}
            )
    except Exception:
        pass  # Neo4j indisponível não deve impedir a exclusão no PostgreSQL

    # Remove o próprio usuário
    db.delete(db_user)
    db.commit()

    return {"message": "Conta excluída com sucesso. Todos os seus dados foram removidos."}
