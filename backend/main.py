import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Importações do seu projeto (Certifique-se que o arquivo se chama models.py)
from models import User, get_db, Base, engine

# Cria as tabelas no banco de dados se não existirem
Base.metadata.create_all(bind=engine)

# 1. INICIALIZAÇÃO DO APP
app = FastAPI(title="Indicae API")

# 2. CONFIGURAÇÃO DE CORS (Para o Frontend conseguir conversar com o Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, substitua pelo domínio do Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. CONFIGURAÇÕES DE AMBIENTE (GOOGLE E GITHUB)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# IMPORTANTE: Altere para a sua URL real do Vercel
FRONTEND_URL = "https://seu-dominio.vercel.app" 
GOOGLE_REDIRECT_URI = f"{FRONTEND_URL}/api/auth/google/callback"

# ----------------------------------------------------------------
# ROTAS DE AUTENTICAÇÃO GOOGLE
# ----------------------------------------------------------------

@app.get("/api/auth/google/login")
async def google_login():
    """Redireciona o usuário para o login do Google"""
    scope = "openid%20email%20profile"
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"response_type=code&client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&scope={scope}"
    )
    return RedirectResponse(url)

@app.get("/api/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Recebe o código do Google e loga/cadastra o usuário"""
    async with httpx.AsyncClient() as client:
        # Troca código por Token
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        token_data = token_res.json()
        
        if "access_token" not in token_data:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_auth_failed")

        # Busca dados do perfil
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        user_info = user_info_res.json()

    email = user_info.get("email")
    user = db.query(User).filter(User.email == email).first()

    # Se não existe, cria (Suporte a quem não tem GitHub)
    if not user:
        user = User(
            name=user_info.get("name"),
            email=email,
            role="User",
            github_user=None,
            bio="Entrou via Google"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return RedirectResponse(f"{FRONTEND_URL}/feed?userId={user.id}")

# ----------------------------------------------------------------
# OUTRAS ROTAS DO SISTEMA (EXEMPLOS)
# ----------------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "Indicae API is running!"}

@app.get("/api/users/profile/{user_id}")
async def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

# Adicione aqui o restante das suas rotas de busca, skills, etc.
