import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# IMPORTANTE: Verifique se o nome do seu arquivo de banco é models ou database
from models import User, get_db, Base, engine

# Inicia o banco
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Middleware para não dar erro de travamento entre Vercel e Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações Google (Pegue no Cloud Console)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# URL do seu site no Vercel
FRONTEND_URL = "https://seu-projeto.vercel.app"
GOOGLE_REDIRECT_URI = f"{FRONTEND_URL}/api/auth/google/callback"

@app.get("/api/auth/google/login")
async def google_login():
    scope = "openid%20email%20profile"
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope={scope}"
    )

@app.get("/api/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        # 1. Troca o código pelo token
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
        
        # 2. Pega info do usuário
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
            github_user=None, # Suporte para quem não tem GitHub
            bio="Usuário Indicae via Google"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return RedirectResponse(f"{FRONTEND_URL}/feed?userId={user.id}")

# --- SUAS OUTRAS ROTAS ORIGINAIS ABAIXO ---
@app.get("/")
def read_root():
    return {"status": "online"}
