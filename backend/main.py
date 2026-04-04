import os
import httpx
import jwt
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

# --- IMPORTS DO RATE LIMITING ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Importação dos Modelos e Banco de Dados
from models import User
from database import get_db, Base, engine

# Inicia o banco
Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CONFIGURAÇÃO DO RATE LIMITING ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. CONFIGURAÇÃO DE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://indicae-app.vercel.app", 
        "http://localhost:3000"           
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURAÇÕES DE AMBIENTE (OAUTH E URLS) ---
FRONTEND_URL = "https://indicae-app.vercel.app"

# Google
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = f"{FRONTEND_URL}/api/auth/google/callback"

# GitHub (Adicione essas variáveis no seu Render)
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

# --- CONFIGURAÇÕES DE E-MAIL ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = os.getenv("SMTP_USERNAME") 
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") 
SECRET_KEY = os.getenv("SECRET_KEY", "chave-super-secreta-indicae")

# --- FUNÇÕES DE E-MAIL ---
def create_verification_token(email: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode({"sub": email, "exp": expire}, SECRET_KEY, algorithm="HS256")

def send_verification_email(email: str, token: str):
    verify_url = f"https://indicae-backend.onrender.com/api/users/verify-email?token={token}"
    msg = MIMEText(f"Olá! Clique no link para ativar sua conta no Indicae:\n\n{verify_url}", "plain", "utf-8")
    msg["Subject"] = "Ative sua conta no Indicae"
    msg["From"] = SMTP_USERNAME
    msg["To"] = email

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")

# --- SCHEMAS ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    confirmPassword: str
    github: str = ""
    bio: str = ""
    skills: str = ""
    role: str = "Dev"

# ================================================================
# ROTAS DE AUTENTICAÇÃO - GOOGLE
# ================================================================

@app.get("/api/auth/google/login")
@limiter.limit("5/minute") 
async def google_login(request: Request):
    scope = "openid%20email%20profile"
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope={scope}"
    )

@app.get("/api/auth/google/callback")
async def google_callback(request: Request, code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
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
        
        user_info = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data.get('access_token')}"}
        )
        data = user_info.json()

    email = data.get("email")
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=data.get("name"),
            email=email,
            github_username=None,           # CORRIGIDO PARA github_username
            hashed_password="google_oauth", # CORRIGIDO PARA NÃO DAR ERRO NO BANCO
            bio="Usuário Indicae via Google",
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return RedirectResponse(f"{FRONTEND_URL}/feed?userId={user.id}")

# ================================================================
# ROTAS DE AUTENTICAÇÃO - GITHUB (NOVO)
# ================================================================

@app.get("/api/auth/github/login")
@limiter.limit("5/minute")
async def github_login(request: Request):
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=user:email"
    )

@app.get("/api/auth/github/callback")
async def github_callback(request: Request, code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
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
            return RedirectResponse(f"{FRONTEND_URL}/login?error=github_auth_failed")

        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        data = user_res.json()

        # O email primário do GitHub pode ser privado, precisamos buscar separadamente
        emails_res = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        emails_data = emails_res.json()
        email = next((e["email"] for e in emails_data if e["primary"]), None)

    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_email")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=data.get("name") or data.get("login"),
            email=email,
            github_username=data.get("login"), # PREENCHE O NOME DE USUÁRIO DO GITHUB AQUI
            hashed_password="github_oauth",    # CORRIGIDO PARA NÃO DAR ERRO NO BANCO
            bio=data.get("bio", "Usuário Indicae via GitHub"),
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return RedirectResponse(f"{FRONTEND_URL}/feed?userId={user.id}")

# ================================================================
# ROTAS DE CADASTRO MANUAL E VERIFICAÇÃO DE E-MAIL
# ================================================================

@app.post("/api/users/register")
@limiter.limit("5/minute")
async def register_user(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    email = user_data.email
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    new_user = User(
        name=user_data.name,
        email=email,
        github_username=user_data.github,   # CORRIGIDO PARA github_username
        hashed_password=user_data.password, # CORRIGIDO PARA NÃO DAR ERRO NO BANCO
        bio=user_data.bio,
        role=user_data.role,
        is_verified=False 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if SMTP_USERNAME and SMTP_PASSWORD:
        token = create_verification_token(new_user.email)
        send_verification_email(new_user.email, token)

    return {"message": "Usuário cadastrado com sucesso. Verifique seu e-mail para ativar a conta."}

@app.get("/api/users/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        user.is_verified = True
        db.commit()
        
        return RedirectResponse(f"{FRONTEND_URL}/login?msg=email_verificado")
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="O link de verificação expirou.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Link de verificação inválido.")

# ================================================================
# ROTAS BÁSICAS
# ================================================================

@app.get("/")
def read_root():
    return {"status": "online"}
