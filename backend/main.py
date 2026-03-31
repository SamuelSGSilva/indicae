from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import models, schemas, database
from neo4j_provider import neo4j_db
from fastapi.middleware.cors import CORSMiddleware
from gemini_ai import get_intention_embedding
import requests
import httpx
import os
import base64
from dotenv import load_dotenv

load_dotenv(override=True)
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:4455")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")

# Cria tabelas no banco de dados (SQLite/Postgres não importam pro modelo)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Indicae API",
    description="Motor de Recomendação e API Principal para o MVP do Indicae.",
    version="1.0.0",
)

# Configuração de CORS para permitir que o Frontend interaja com o Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://127.0.0.1:4455", "http://localhost:4455"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Indicae. O Motor está online."}

def fetch_github_skills(username: str):
    try:
        # Puxa os ultimos 10 repositórios para ver o que a pessoa mais codifica
        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            repos = response.json()
            languages = set()
            for r in repos:
                lang = r.get("language")
                if lang:
                    languages.add(lang)
            return list(languages)
    except Exception as e:
        print(f"Erro integracao Github: {e}")
    return []

@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # 1. Verifica se já existe
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado.")
    
    # 2. Salva no Banco Relacional (PostgreSQL) - Fake password hash para MVP
    fake_hashed_password = user.password + "notreallyhashed"
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        hashed_password=fake_hashed_password, 
        role=user.role, 
        github_username=user.github_username,
        bio=user.bio
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Integração Mágica: Puxar do GitHub automaticamente
    github_skills = []
    if new_user.github_username:
        github_skills = fetch_github_skills(new_user.github_username)
    
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
def login(request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == request.email).first()
    if not db_user or db_user.hashed_password != (request.password + "notreallyhashed"):
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
    try:
        results = neo4j_db.query(query_skills, parameters={"id": user_id})
        skills = []
        trust_score = 0
        intentions = []
        validations_given = 0
        
        if results:
            record = dict(results[0])
            skills = record.get("skills", [])
            trust_score = record.get("trust_score", 0)
            intentions = record.get("intentions", [])
            validations_given = record.get("validations_given", 0)
            
            # Lidar com nulls do Neo4j
            skills = [s for s in skills if s]
            intentions = [i for i in intentions if i]
            
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
            badges.append({"icon": "🤝", "name": "Pilar da Comunidade", "desc": "Fortaleceu a rede endossando colegas"})

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/{user_id}/profile")
def update_user_profile(user_id: int, request: schemas.UserUpdateRequest, db: Session = Depends(database.get_db)):
    # 1. Atualizar no Banco Relacional (PostgreSQL blindado)
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    if request.name is not None:
        db_user.name = request.name
    if request.bio is not None:
        db_user.bio = request.bio
        
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
        
        # Estruturando na veia para o Recharts consumir!
        top_skills = [{"name": r["name"].title(), "value": r["value"]} for r in skills_res] if skills_res else []
        top_alphas = [{"name": r["name"], "validations": r["validations"], "trust": r["trust"]} for r in alphas_res] if alphas_res else []

        return {
            "top_skills": top_skills,
            "top_alphas": top_alphas
        }
    except Exception as e:
        print(f"Erro Analítico B2B: {e}")
        return {"top_skills": [], "top_alphas": []}

# ==========================================================
# FEED SOCIAL: MOTOR DE INDICAÇÕES B2C (FASE 11)
# ==========================================================
@app.get("/api/network/users")
def get_all_users(db: Session = Depends(database.get_db)):
    """ Retorna a lista de usuários da rede com suas Skills, pronto pro Modal de UP. """
    users = db.query(models.User).all()
    feed = []
    
    for u in users:
        # Pega as Skills do Grafo pra facilitar o Frontend
        query_skills = "MATCH (user:User {id: $uid})-[:HAS_SKILL]->(s:Skill) RETURN s.name AS skill"
        try:
            res = neo4j_db.query(query_skills, parameters={"uid": u.id})
            user_skills = [r["skill"] for r in res] if res else []
        except:
            user_skills = []
            
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
def github_callback(code: str, state: str, db: Session = Depends(database.get_db)):
    """ Callback Oficial da Microsoft! """
    try:
        bio = base64.b64decode(state).decode()
        
        # 1. Troca o 'code' temporário por um Token Real de Acesso
        token_res = requests.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"}
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            return RedirectResponse(f"{FRONTEND_URL}/cadastro?error=github_token_failed")

        # 2. Requisita os Dados Imutáveis do Usuário
        user_res = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        gh_user = user_res.json()
        gh_username = gh_user.get("login")
        gh_name = gh_user.get("name") or gh_username
        gh_email = gh_user.get("email") or f"{gh_username}@github_fake.com"
        
        # 3. Magic Trick: Logar ou Criar (Se for novo, cadastra em tudo: PostgreSQL + Neo4J)
        db_user = db.query(models.User).filter(models.User.github_username == gh_username).first()
        
        if not db_user:
            # Nunca entrou antes, criando! Senha Randomica pois ele sempre usará Github OAuth
            import uuid
            db_user = models.User(
                name=gh_name,
                email=gh_email,
                hashed_password=str(uuid.uuid4()),
                role="b2c",
                github_username=gh_username,
                bio=bio
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
            # Puxamos tudo do Github dele pros Grafos
            github_skills = fetch_github_skills(gh_username)
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
                "role": db_user.role, "github": gh_username, "bio": bio, "skills": github_skills
            })
            
        # 4. Sucesso total: Chuta o cara pro FrontEnd do Next já logado!
        return RedirectResponse(f"{FRONTEND_URL}/?user_id={db_user.id}&user_name={db_user.name}")
        
    except Exception as e:
        print(f"Erro no OAuth: {str(e)}")
        return RedirectResponse(f"{FRONTEND_URL}/cadastro?error=github_crash")

@app.post("/api/network/validate")
def validate_skill(validation: schemas.ValidationCreate):
    # Lógica do Grafo: Conecta duas pessoas via uma habilidade com um Peso
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
            "target_user_id": validation.target_user_id,
            "skill_name": validation.skill_name,
            "weight": validation.weight
        })
        return {"message": f"Você acabou de endossar a habilidade {validation.skill_name}!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de Grafo: {str(e)}")

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
        return {"talents": [dict(r) for r in results]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
            
            # Upsert Source Node
            if s_id not in nodes_dict:
                nodes_dict[s_id] = {
                    "id": s_id, 
                    "label": record["source_label"], 
                    "name": record["source_name"]
                }
            # Upsert Target Node
            if t_id not in nodes_dict:
                nodes_dict[t_id] = {
                    "id": t_id, 
                    "label": record["target_label"], 
                    "name": record["target_name"]
                }
            
            # Add Link
            links.append({
                "source": s_id,
                "target": t_id,
                "label": record["rel_type"],
                "weight": record.get("rel_weight") or 1
            })
            
        nodes = list(nodes_dict.values())
        return {"nodes": nodes, "links": links}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro Dataviz: {str(e)}")

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
        raise HTTPException(status_code=500, detail=str(e))

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
