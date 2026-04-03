import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
import httpx

# Configurações de ambiente (Adicione no Render/Vercel)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "https://seu-dominio.vercel.app/api/auth/google/callback"

@app.get("/api/auth/google/login")
async def google_login():
    # Redireciona o usuário para a tela de permissão do Google
    scope = "openid%20email%20profile"
    return RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope={scope}"
    )

@app.get("/api/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    # 1. Troca o código temporário por um Token de Acesso
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
        
        # 2. Busca os dados do perfil do usuário no Google
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        user_info = user_info_res.json()

    email = user_info.get("email")
    user = db.query(User).filter(User.email == email).first()

    # 3. Se o usuário não existe, cria um novo (Suporte a quem não tem GitHub)
    if not user:
        user = User(
            name=user_info.get("name"),
            email=email,
            role="User",
            github_user=None, # Usuário vindo do Google não precisa de GitHub inicial
            bio="Entrou via Google"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 4. Redireciona de volta para o Feed do Frontend logado
    return RedirectResponse(f"https://seu-dominio.vercel.app/feed?userId={user.id}")
