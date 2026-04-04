from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
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
from collections import defaultdict
from dotenv import load_dotenv

# ── Rate limiter simples em memória ──
_rate_store: dict = defaultdict(list)
_RATE_LIMIT = 20        # max requisições
_RATE_WINDOW = 60       # por janela de 60s

def check_rate_limit(request: Request, limit: int = _RATE_LIMIT):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    timestamps = [t for t in _rate_store[ip] if now - t < _RATE_WINDOW]
    timestamps.append(now)
    _rate_store[ip] = timestamps
    if len(timestamps) > limit:
        raise HTTPException(status_code=429, detail="Muitas requisições. Aguarde um momento.")

# ─── Fix Total: Monkey Patch global no resolver de DNS via Socket (bypass VPN) ────
# O Windows + VPN as vezes não resolve o dns pelo Python.
import socket
_original_getaddrinfo = socket.getaddrinfo

# IPs hardcoded do GitHub (Fallbacks seguros quando getaddrinfo original falhar)
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
    """Retorna um httpx.Client padrão mas que agora herdará o socket patcheado do sistema"""
    transport = httpx.HTTPTransport(retries=2)
    return httpx.Client(
        trust_env=False,
        verify=True,   # SSL verificado em producao
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

# Cria tabelas no banco de dados (SQLite/Postgres não importam pro modelo)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Indicae API",
    description="Motor de Recomendação e API Principal para o MVP do Indicae.",
    version="1.0.0",
)

# Configuração de CORS para permitir que o Frontend interaja com o Backend
# CORS: inclui FRONTEND_URL + origens de desenvolvimento + Vercel wildcard
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
            # Linguagem principal do repo
            if r.get("language"):
                languages.add(r["language"])

            # Busca detalhamento de linguagens do repo (bytes por linguagem)
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

@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(req: Request, user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    check_rate_limit(req, limit=5)  # cadastro: max 5/min por IP
    # 1. Verifica se já existe
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado.")
    
    # 2. Salva no Banco Relacional (PostgreSQL) - Fake password hash para MVP
    import bcrypt
    hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    # Sanitiza inputs
    safe_name = user.name.strip()[:150]
    safe_bio = (user.bio or "").strip()[:1000]
    safe_github = (user.github_username or "").strip().lstrip("@")[:100]
    # Valida role
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
    
    # Integração Mágica: Puxar do GitHub automaticamente
    github_skills = []
    if new_user.github_username:
        github_skills = fetch_github_skills(new_user.github_username)

    # Salva skills no SQL (garantia de persistência independente do Neo4j)
    for skill_name in github_skills:
        existing = db.query(models.UserSkill).filter(
            models.UserSkill.user_id == new_user.id,
            models.UserSkill.skill_name == skill_name.lower()
        ).first()
        if not existing:
            db.add(models.UserSkill(user_id=new_user.id, skill_name=skill_name.lower(), source="github"))
    db.commit()
    
    # 3. Salva no Banco de Grafos (Neo4j)
    # Criamos o usuário e, se vieram Skills do GitHub, linkamos com :HAS_SKILL
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
        
    return new_user

@app.post("/api/login")
def login(req: Request, request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    check_rate_limit(req, limit=10)  # login: max 10/min por IP
    import bcrypt, time
    db_user = db.query(models.User).filter(models.User.email == request.email.strip().lower()).first()
    # Timing-safe: sempre roda o bcrypt para evitar timing attack
    dummy_hash = "$2b$12$AAAAAAAAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    check_hash = db_user.hashed_password if db_user else dummy_hash
    # Senhas OAuth (uuid) nao sao verificaveis — bloqueia tentativa
    try:
        password_ok = bcrypt.checkpw(request.password.encode("utf-8"), check_hash.encode("utf-8"))
    except Exception:
        password_ok = False
    if not db_user or not password_ok:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return {"message": "Sucesso", "user_id": db_user.id, "name": db_user.name}

@app.get("/api/users/{user_id}/profile", response_model=schemas.UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(database.get_db)):
    # 1. Pega dados puros (SQL)
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # 2. IA / Grafo: Somar a Reputação (Endossos), listar Skills e ver Validações Feitas
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
    # Tenta buscar dados do Neo4j; se falhar, usa valores padrão (evita 500)
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
            # Lidar com nulls do Neo4j
            skills = [s for s in skills if s]
            intentions = [i for i in intentions if i]
    except Exception:
        # Neo4j indisponível: retorna dados parciais (só SQL) em vez de 500
        pass

    # Se Neo4j não retornou skills, busca no SQL (tabela user_skills)
    if not skills:
        sql_skills = db.query(models.UserSkill).filter(models.UserSkill.user_id == user_id).all()
        skills = [s.skill_name for s in sql_skills]

    # trust_score via SQL (contagem de apoios recebidos) se Neo4j falhou
    if trust_score == 0:
        validations_received = db.query(models.Validation).filter(
            models.Validation.target_user_id == user_id
        ).all()
        trust_score = sum(v.weight for v in validations_received)
        validations_given = db.query(models.Validation).filter(
            models.Validation.validator_id == user_id
        ).count()

    # ==========================================
    # FASE 8: MOTOR DE CONQUISTAS (BADGES)
    # ==========================================
    badges = []
    if trust_score > 0:
        badges.append({"icon": "🛡️", "name": "Membro Verificado", "desc": "Recebeu confiança da rede"})
    if trust_score >= 20:
        badges.append({"icon": "⭐", "name": "Talento de Ouro", "desc": "Autoridade máxima (" + str(trust_score) + " pts)"})
    if len(skills) >= 5:
        badges.append({"icon": "🐙", "name": "Poliglota Tech", "desc": f"Domina {len(skills)} tecnologias"})
    if validations_given > 0:
        badges.append({"icon": "🤝", "name": "Pilar da Comunidade", "desc": "Fortaleceu a rede apoiando colegas"})

    return {
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "role": db_user.role,
        "github_username": db_user.github_username,
        "bio": db_user.bio,
        "trust_score": trust_score or 0,
        "skills": skills,
        "intentions": intentions,
        "badges": badges
    }

@app.post("/api/users/{user_id}/sync-skills")
def sync_github_skills(user_id: int, db: Session = Depends(database.get_db)):
    """Re-sincroniza as skills do GitHub para um usuario existente"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if not db_user.github_username:
        raise HTTPException(status_code=400, detail="Usuário não possui username do GitHub cadastrado.")

    github_skills = fetch_github_skills(db_user.github_username)

    if not github_skills:
        return {"message": "Nenhuma skill encontrada no GitHub.", "skills": []}

    # Salva novas skills no SQL (sem duplicar)
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

    # Tenta sincronizar com Neo4j também
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

@app.put("/api/users/{user_id}/profile")
def update_user_profile(user_id: int, request: schemas.UserUpdateRequest, db: Session = Depends(database.get_db)):
    # Sanitiza inputs antes de salvar
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
    
    # 2. Atualizar no Motor Analítico (Neo4j) simultaneamente
    # Se o nome ou bio for alterado, propaga pro Grafo para manter as intenções com nomes frescos!
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

# ==========================================================
# FASE 9: MOTOR ANALÍTICO DE RECURSOS HUMANOS (B2B Ticker)
# ==========================================================
@app.get("/api/analytics/trends")
def b2b_market_trends():
    """ Traz inteligência de mercado executiva baseada 100% no Grafo. """
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

    # Fallback SQL
    from sqlalchemy import func as sqlfunc
    from sqlalchemy.orm import Session as _S
    db: _S = next(database.get_db())
    try:
        # Top skills: contagem de apoios por skill
        skill_counts = db.query(
            models.Validation.skill_name,
            sqlfunc.count(models.Validation.id).label("value")
        ).group_by(models.Validation.skill_name).order_by(sqlfunc.count(models.Validation.id).desc()).limit(8).all()

        # Se nao houver apoios, conta de user_skills (skills do GitHub)
        if not skill_counts:
            skill_counts = db.query(
                models.UserSkill.skill_name,
                sqlfunc.count(models.UserSkill.id).label("value")
            ).group_by(models.UserSkill.skill_name).order_by(sqlfunc.count(models.UserSkill.id).desc()).limit(8).all()

        top_skills = [{"name": r.skill_name.title(), "value": r.value} for r in skill_counts]

        # Top alphas: soma de apoios recebidos por usuario
        alpha_counts = db.query(
            models.User.name,
            sqlfunc.count(models.Validation.id).label("validations"),
            sqlfunc.sum(models.Validation.weight).label("trust")
        ).join(models.Validation, models.Validation.target_user_id == models.User.id)         .group_by(models.User.id, models.User.name)         .order_by(sqlfunc.sum(models.Validation.weight).desc()).limit(5).all()

        top_alphas = [{"name": r.name, "validations": r.validations, "trust": int(r.trust or 0)} for r in alpha_counts]

        return {"top_skills": top_skills, "top_alphas": top_alphas}
    finally:
        db.close()

# ==========================================================
# FEED SOCIAL: MOTOR DE INDICAÇÕES B2C (FASE 11)
# ==========================================================
@app.get("/api/network/users")
def get_all_users(db: Session = Depends(database.get_db)):
    """ Retorna a lista de usuários da rede com suas Skills, pronto pro Modal de UP. """
    users = db.query(models.User).all()
    feed = []
    
    for u in users:
        # Pega as Skills do Grafo, ou do SQL como fallback
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

# ==========================================================
# OAUTH2 GITHUB (FASE 7)
# ==========================================================
@app.get("/api/auth/github/login")
def github_login(bio: str = ""):
    """ Rota que o botão do Frontend chama. Redireciona pro Github Oficial enviando a Bio no state limitando ataque CSRF """
    state = base64.b64encode(bio.encode()).decode()
    redirect_uri = f"{BACKEND_URL}/api/auth/github/callback"
    github_url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={redirect_uri}&scope=read:user,user:email&state={state}"
    return RedirectResponse(github_url)

@app.get("/api/auth/github/callback")
def github_callback(code: str, state: str = "", db: Session = Depends(database.get_db)):
    """Callback do GitHub OAuth — corrigido para novos e usuários existentes"""
    try:
        # Decodifica bio do state com segurança
        try:
            bio = base64.b64decode(state + "==").decode("utf-8", errors="ignore")
        except Exception:
            bio = ""

        with _github_client() as client:
            # 1. Troca code por token
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

            # 2. Dados do usuário
            user_res = client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            gh_user = user_res.json()

            # 3. Tenta buscar email verificado se nao veio no perfil publico
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
        # Fallback de email unico e identificavel
        if not gh_email:
            gh_email = f"{gh_username}@users.noreply.github.com"

        import uuid

        # 4. Busca por github_username OU email (usuario pode ter se cadastrado manualmente antes)
        db_user = (
            db.query(models.User).filter(models.User.github_username == gh_username).first()
            or db.query(models.User).filter(models.User.email == gh_email).first()
        )

        if db_user:
            # Atualiza dados que podem ter mudado
            db_user.github_username = gh_username
            if not db_user.name or db_user.name == db_user.email.split("@")[0]:
                db_user.name = gh_name
            db.commit()
        else:
            # Cria novo usuario
            db_user = models.User(
                name=gh_name,
                email=gh_email,
                hashed_password=str(uuid.uuid4()),
                role="b2c",
                github_username=gh_username,
                bio=bio,
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

        # 5. Sincroniza skills do GitHub no SQL (sempre, nao so no cadastro)
        github_skills = fetch_github_skills(gh_username)
        for skill_name in github_skills:
            exists = db.query(models.UserSkill).filter(
                models.UserSkill.user_id == db_user.id,
                models.UserSkill.skill_name == skill_name.lower(),
            ).first()
            if not exists:
                db.add(models.UserSkill(user_id=db_user.id, skill_name=skill_name.lower(), source="github"))
        db.commit()

        # 6. Tenta sincronizar com Neo4j
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

# ==========================================================
# GOOGLE OAUTH
# ==========================================================
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
    """Callback do Google OAuth"""
    try:
        redirect_uri = f"{BACKEND_URL}/api/auth/google/callback"

        # 1. Troca code por token
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

        # 2. Dados do usuario Google
        user_res = httpx.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15.0,
            verify=False,
        )
        g_user = user_res.json()

        g_email = g_user.get("email")
        g_name = g_user.get("name") or (g_email.split("@")[0] if g_email else "Usuario")

        if not g_email:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_no_email")

        # 3. Logar ou criar por email
        import uuid
        db_user = db.query(models.User).filter(models.User.email == g_email).first()

        if db_user:
            # Atualiza nome se estava vazio
            if not db_user.name:
                db_user.name = g_name
                db.commit()
        else:
            db_user = models.User(
                name=g_name,
                email=g_email,
                hashed_password=str(uuid.uuid4()),
                role="b2c",
                github_username=None,
                bio="",
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

@app.post("/api/network/validate")
def validate_skill(validation: schemas.ValidationCreate, db: Session = Depends(database.get_db)):
    # 1. Sempre salva no SQL (persistência garantida)
    skill_clean = validation.skill_name.strip().lower()[:100]
    if not skill_clean:
        raise HTTPException(status_code=400, detail="Nome da skill inválido.")
    weight_safe = max(1, min(int(validation.weight or 1), 10))  # entre 1 e 10
    db_validation = models.Validation(
        validator_id=validation.validator_id,
        target_user_id=validation.target_user_id,
        skill_name=skill_clean,
        weight=weight_safe,
    )
    db.add(db_validation)
    db.commit()

    # 2. Tenta sincronizar com Neo4j (opcional)
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
        pass  # Neo4j indisponível, mas já salvou no SQL

    return {"message": f"Você acabou de apoiar a habilidade {validation.skill_name}!"}

# ==========================================================
# ROTA CORPORATIVA B2B (MONETIZAÇÃO)
# ==========================================================
@app.get("/api/b2b/search")
def b2b_talent_search(skill: str):
    """ Busca candidatos por Habilidade Específica ordenando pela Confiança """
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

    # Fallback SQL: busca por skill em user_skills e validacoes
    from sqlalchemy import func as sqlfunc, or_
    from sqlalchemy.orm import Session as _S
    db: _S = next(database.get_db())
    try:
        skill_lower = skill.strip().lower()
        # Usuarios com essa skill (via GitHub ou apoios recebidos)
        user_ids_skills = db.query(models.UserSkill.user_id).filter(
            models.UserSkill.skill_name.ilike(f"%{skill_lower}%")
        ).subquery()
        user_ids_validation = db.query(models.Validation.target_user_id).filter(
            models.Validation.skill_name.ilike(f"%{skill_lower}%")
        ).subquery()

        from sqlalchemy import union
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
    # 1. Busca os candidatos no Relacional para ler as BIOS originais
    candidates = db.query(models.User).filter(models.User.id.in_(fit_req.candidates_ids)).all()
    if not candidates:
        raise HTTPException(status_code=404, detail="Nenhum candidato encontrado")
        
    # 2. Montar pacote de dados para o Modelo
    cands_data = []
    for c in candidates:
        bio_texto = c.bio if c.bio else "Este candidato optou por não descrever um estilo de trabalho. Analise as habilidades presumidas indiretamente."
        cands_data.append(f"[Candidato ID: {c.id}] Habilidades mapeadas via Graph: Não detalhadas. Bio/Visão do Candidato: {bio_texto}")
    
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
        # Limpar possiveis rebites do markdown
        json_text = response.text.strip().replace("```json", "").replace("```", "")
        import json
        resultado = json.loads(json_text)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de Análise Gemini: {str(e)}")

# ==========================================================
# DATAVIZ 3D - VISUALIZE GRAPH ENDPOINT
# ==========================================================
@app.get("/api/network/visualize")
def visualize_network():
    """ Retorna o Grafo formatado para a biblioteca Force-Graph-3D """
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
        # Neo4j vazio ou indisponível: usa SQL como fallback
        raise Exception("Neo4j vazio")
    except Exception:
        pass

    # ── Fallback SQL: monta grafo a partir das validações salvas no banco relacional ──
    from sqlalchemy.orm import Session as _Session
    db: _Session = next(database.get_db())
    try:
        users = db.query(models.User).all()
        validations = db.query(models.Validation).all()
        skills_map: dict = {}  # skill_name -> node_id

        nodes_dict = {}
        links = []

        # Nós de usuários
        for u in users:
            nodes_dict[f"u{u.id}"] = {"id": f"u{u.id}", "label": "User", "name": u.name}

        # Nós de skills + links
        skill_counter = 0
        for v in validations:
            skill_key = v.skill_name.lower()
            if skill_key not in skills_map:
                skill_counter += 1
                sid = f"s{skill_counter}"
                skills_map[skill_key] = sid
                nodes_dict[sid] = {"id": sid, "label": "Skill", "name": v.skill_name}
            sid = skills_map[skill_key]
            # target -> skill
            links.append({"source": f"u{v.target_user_id}", "target": sid, "label": "HAS_SKILL", "weight": 1})
            # validator -> target
            links.append({"source": f"u{v.validator_id}", "target": f"u{v.target_user_id}", "label": "APOIOU", "weight": v.weight})

        return {"nodes": list(nodes_dict.values()), "links": links}
    finally:
        db.close()

@app.post("/api/intentions")
def log_intention(intention: schemas.IntentionCreate, db: Session = Depends(database.get_db)):
    # 1. IA: Transforma o texto em Vetor (768 dimensões) via Gemini
    embedding_vector = get_intention_embedding(intention.intent_text)
    
    # 2. Salva no Banco Relacional junto com o Vetor Matematico
    new_intention = models.Intention(
        user_id=intention.user_id, 
        text=intention.intent_text, 
        embedding=embedding_vector
    )
    db.add(new_intention)
    db.commit()

    # 3. Salva no Grafo (Neo4j) para as amarrações visuais futuras
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
        # Neo4j indisponível: intenção já foi salva no SQL, retorna sucesso parcial
        return {"message": "Sua intenção foi registrada com sucesso!"}

@app.get("/api/match/{user_id}")
def find_match(user_id: int, db: Session = Depends(database.get_db)):
    # 1. Pega a última intenção vetorial da pessoa logada
    user_latest_intent = db.query(models.Intention).filter(models.Intention.user_id == user_id).order_by(models.Intention.created_at.desc()).first()
    
    if not user_latest_intent:
        return {"matches": []}
        
    # 2. Magia Negra da I.A Vetorial: Busca as Top 5 intenções mais similares 
    # por aproximação de Coseno (<->) no pgvector, excluindo as do próprio usuário
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
