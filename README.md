<div align="center">
  <img src="./frontend/public/favicon.ico" width="80" />
  <h1>INDICAE - A Malha Neural de Talentos</h1>
  <p><b>A Primeira HR-Tech baseada em Identidade Verificada, Banco de Grafos 3D e IA Generativa.</b></p>
</div>

---

## 🚀 O Fim da Compra de Currículos ("O Problema")
O mercado de contratação atual B2B (Métricas de LinkedIn/Gupy) baseia-se em planilhas de currículos que **qualquer um pode falsificar**. Recrutadores gastam semanas filtrando pessoas que não sabem as linguagens que dizem saber.

## 💎 O "Tinder dos Mentores" ("A Solução Indicae")
Nós criamos uma plataforma operada não por currículos textuais, mas pela geometria social do **Neo4j (Banco de Banco de Dados de Grafos)** e Criptografia. 
- **O Dev** não digita quais linguagens ele sabe. Ele entra conectando o *Github via OAuth2* e o Indicae extrai sua "Prova de Trabalho" (Proof of Work) silenciosamente.
- **O Professor/Mentor/Colega** entra e dá um "Up / Like", chancelando com seu peso social (Colega=+1pt; Mentor=+5pts) que aquele Desenvolvedor realmente sabe React e é confiável.
- **O Recrutador B2B** abre a central analítica, e vê os candidatos filtrados pelas validações em tempo real mapeadas por IA. E a Busca? Não é busca. O Gemini do Google cruza automaticamente o Fit Cultural do candidato com a "Ideologia da Vaga".

---

## 🧠 Arquitetura Técnica (Como foi construída essa Ferrari)

Nossa Stack é altamente isolada, escalável e operada sob microsserviços pesados:

1. **A Visualização (Next.js / Frontend):** Todo PWA Estático, Híbrido Web e Mobile Nativo (Capacitor). Estilo UI Glassmorphism moderno. Gráficos dinâmicos de Recursos Humanos pelo *Recharts* e uma Visualização Interativa Tridimensional das conexões no Grafo do Recrutamento (`react-force-graph-3d`).
2. **O Motor Lógico Principal (FastAPI / Backend):** API REST assíncrona feita em Python (Uvicorn/Gunicorn). Operada por Pydantic.
3. **A Autenticação (Microsoft OAuth2):** Interceptor que bloqueia ataques CSRF e não confia no que o usuário digita na hora de se cadastrar. O Estado do Cadastro é mantido nas arestas do Grafo com IDs reais do Github.
4. **O Cofre Isolado Híbrido:**
   * **PostgreSQL:** Usado como "Source of Truth" fixo para senhas hasheadas e controle relacional básico (Protegido por SQLAlchemy e Alembic).
   * **Neo4j (O Diferencial do Século):** Um Motor Geométrico não-relacional 100% focado no cruzamento de dados O(1). Toda validação (Endosso) vira uma aresta vetorial. Assim achamos "Quem Validou Quem" sem queries destrutivas que causariam gargalo de processamento, e ainda alimentamos o algoritmo de Gamificação do Dev B2C.

---

## 📱 Guia Rápido de Instalação (Deploy Local)

1. Suba os Motores de Banco de Dados (Neo4j e Postgres):
   ```bash
   docker-compose up -d
   ```
2. Inicialize o Backend Mágico:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
3. Puxe o Frontend Next.js Reativo:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🌎 Manual de Voo: Colocando o Indicae na Nuvem

Para que o aplicativo funcione no seu celular sem cabos e para o mundo todo ver, siga estes 4 passos:

### 1. Banco de Dados (Os Motores)
- **PostgreSQL**: Crie um projeto no **Supabase** e copie a `URL de Conexão` (Transaction Mode) para usar como `DATABASE_URL`.
- **Neo4j**: Crie uma instância gratuita no **Neo4j AuraDB** e salve o arquivo de credenciais (`NEO4J_URI`, `USER`, `PASSWORD`).

### 2. Backend (A Mente) - Render.com
- Crie um novo **Web Service** no Render conectando seu repositório do GitHub.
- O Render vai detectar o arquivo `render.yaml` que eu criei.
- Configure as **Environment Variables** no painel do Render usando os dados do Passo 1.
- Defina `BACKEND_URL` como a URL que o Render te der (ex: `https://indicae-api.onrender.com`).

### 3. Frontend (A Face) - Vercel
- Conecte seu repositório na **Vercel**.
- Configure a variável `NEXT_PUBLIC_API_URL` com a URL do seu Backend no Render.
- Defina `FRONTEND_URL` como a URL que a Vercel te der.

### 4. GitHub OAuth (A Chave)
- Vá em *Settings > Developer Settings > OAuth Apps* no seu GitHub.
- Atualize a **Homepage URL** para a URL da Vercel.
- Atualize a **Authorization callback URL** para: `https://SUA-URL-DO-RENDER.com/api/auth/github/callback`.

---

> **Feito em Pair-Programming com Antigravity / DeepMind AI Tooling.**
