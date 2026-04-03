import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
# Importe aqui o seu get_db e User do seu arquivo de modelos
# from database import get_db 
# from models import User

# 1. DEFINA O APP PRIMEIRO
app = FastAPI()

# 2. CONFIGURAÇÕES DE AMBIENTE
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "https://seu-dominio.vercel.app/api/auth/google/callback"

# 3. AGORA AS ROTAS FUNCIONARÃO
@app.get("/api/auth/google/login")
async def google_login():
    scope = "openid%20email%20profile"
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope={scope}"
    )

@app.get("/api/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        # 1. Troca o código pelo Token
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
        
        # 2. Busca perfil no Google
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        user_info = user_info_res.json()

    email = user_info.get("email")
    user = db.query(User).filter(User.email == email).first()

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

    return RedirectResponse(f"https://seu-dominio.vercel.app/feed?userId={user.id}")

# Mantenha o restante das suas rotas abaixo...
