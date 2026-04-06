<div align="center">

<img src="./frontend/public/favicon.ico" width="80" alt="Indicae Logo" />

# Indicae

**A rede onde suas habilidades falam por você.**

[![Deploy](https://img.shields.io/badge/deploy-vercel-black?style=flat-square&logo=vercel)](https://indicae-app.vercel.app)
[![Backend](https://img.shields.io/badge/backend-render-46E3B7?style=flat-square&logo=render)](https://render.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Neo4j](https://img.shields.io/badge/Neo4j-grafos-008CC1?style=flat-square&logo=neo4j)](https://neo4j.com)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](LICENSE)

[🌐 Acessar plataforma](https://indicae-app.vercel.app) · [🐛 Reportar bug](https://github.com/SamuelSGSilva/indicae/issues) · [✨ Sugerir feature](https://github.com/SamuelSGSilva/indicae/issues)

</div>

---

## O problema

Mais de **50 candidaturas enviadas.** Quase nenhum retorno.

Esse é o cenário de milhares de estudantes e profissionais em início de carreira — em qualquer área. Não por falta de capacidade, mas porque um currículo é uma folha fria. Ele não mostra que você passou madrugadas estudando, que seu professor sabe que você domina aquilo que está escrito ali, que seus colegas confiam no seu trabalho.

**O Indicae resolve isso.**

---

## O que é o Indicae

O Indicae é uma plataforma de networking com **validação social de habilidades**. Você cadastra suas skills, e pessoas reais — professores, colegas, amigos, ex-chefes — validam o que você sabe. Não é você falando de si mesmo. É a sua rede falando por você.

```
Você declara  →  Sua rede valida  →  O mercado confia
```

---

## Funcionalidades

### 👤 Para quem busca oportunidades
- **Perfil com skills validadas** — cada habilidade recebe upvotes de quem te conhece de verdade
- **Sincronização com GitHub** — suas linguagens e repositórios são puxados automaticamente via OAuth
- **Trust Score multidimensional** — pontuação em 3 dimensões: GitHub, Social e Atividade
- **IA Match** — descreva o que você busca e a IA encontra pessoas com intenções similares na rede
- **Avatar personalizado** — foto de perfil via GitHub ou upload manual

### 🏢 Para recrutadores e mentores
- **Busca avançada** — filtre talentos por skills, perfil e fit cultural
- **Análise de fit cultural com IA** — envie o contexto da sua empresa e o Gemini rankeia os candidatos mais compatíveis
- **Grafo da rede** — visualize as conexões e validações de forma gráfica e interativa
- **Analytics de tendências** — veja quais skills estão em alta na plataforma

### ⚙️ Plataforma
- Login com **GitHub OAuth** e **Google OAuth**
- Recuperação de senha via **e-mail** (Resend)
- Notificações em tempo real
- Interface responsiva com bottom nav mobile
- Rate limiting nos endpoints

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Backend** | FastAPI, Python, Gunicorn + Uvicorn |
| **Banco relacional** | PostgreSQL + pgvector |
| **Banco de grafos** | Neo4j |
| **IA / Embeddings** | Google Gemini API |
| **Auth** | GitHub OAuth, Google OAuth, JWT, bcrypt |
| **Email** | Resend |
| **Deploy frontend** | Vercel |
| **Deploy backend** | Render |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                          │
│              Next.js 14 · TypeScript · Vercel            │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│                        Backend                           │
│               FastAPI · Gunicorn · Render                │
└──────┬────────────────┬────────────────────┬────────────┘
       │                │                    │
┌──────▼──────┐  ┌──────▼──────┐  ┌─────────▼──────────┐
│ PostgreSQL  │  │    Neo4j    │  │   Google Gemini     │
│  + pgvector │  │   (grafos)  │  │  (IA Match + Fit)   │
└─────────────┘  └─────────────┘  └────────────────────┘
```

**PostgreSQL** armazena usuários, skills, validações, intenções e notificações.  
**Neo4j** representa a rede de confiança como um grafo — cada validação vira uma aresta.  
**Gemini** gera embeddings para o match semântico por intenção e análise de fit cultural.

---

## Rodando localmente

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Neo4j (local ou [AuraDB](https://neo4j.com/cloud/platform/aura-graph-database/) gratuito)
- Chave da [Google AI Studio](https://aistudio.google.com/) (Gemini)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Crie um `.env` dentro de `backend/`:

```env
DATABASE_URL=postgresql://user:password@localhost/indicae
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=sua_senha
GEMINI_API_KEY=sua_chave
GITHUB_CLIENT_ID=seu_client_id
GITHUB_CLIENT_SECRET=seu_client_secret
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
RESEND_API_KEY=sua_chave
```

```bash
python migrate.py
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
```

Crie um `.env.local` dentro de `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Acesse `http://localhost:3000`.

---

## Deploy na nuvem

### 1. Banco de Dados
- **PostgreSQL** → [Supabase](https://supabase.com) (gratuito). Copie a connection string para `DATABASE_URL`.
- **Neo4j** → [AuraDB](https://neo4j.com/cloud/platform/aura-graph-database/) (gratuito). Salve URI, usuário e senha.

### 2. Backend → Render
- Crie um **Web Service** no Render apontando para este repositório.
- O `render.yaml` já está configurado — só preencha as variáveis de ambiente.

### 3. Frontend → Vercel
- Conecte o repositório na Vercel.
- Defina `NEXT_PUBLIC_API_URL` com a URL do backend no Render.

### 4. GitHub OAuth
- Em *GitHub → Settings → Developer Settings → OAuth Apps*, atualize:
  - **Homepage URL**: URL da Vercel
  - **Callback URL**: `https://sua-api.onrender.com/api/auth/github/callback`

---

## API — Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/users` | Criar conta |
| `POST` | `/api/login` | Login com email/senha |
| `GET` | `/api/users/{id}/profile` | Perfil completo com Trust Score |
| `PUT` | `/api/users/{id}/profile` | Atualizar bio |
| `PUT` | `/api/users/{id}/avatar` | Atualizar foto de perfil |
| `POST` | `/api/users/{id}/sync-skills` | Sincronizar skills do GitHub |
| `POST` | `/api/network/validate` | Dar upvote em uma skill |
| `GET` | `/api/network/users` | Feed da rede |
| `GET` | `/api/network/visualize` | Dados do grafo de conexões |
| `POST` | `/api/intentions` | Cadastrar intenção (IA Match) |
| `GET` | `/api/match/{id}` | Buscar matches por intenção |
| `GET` | `/api/search` | Busca por skill ou nome |
| `GET` | `/api/analytics/trends` | Tendências de skills na rede |
| `GET` | `/api/auth/github/login` | Iniciar OAuth GitHub |
| `GET` | `/api/auth/google/login` | Iniciar OAuth Google |
| `POST` | `/api/auth/forgot-password` | Solicitar redefinição de senha |

---

## Trust Score

O Trust Score é calculado em 3 dimensões independentes, cada uma com peso máximo de 50 pontos:

```
Trust Score Total = GitHub Score + Social Score + Activity Score
```

| Dimensão | Como é calculado | Máx |
|----------|-----------------|-----|
| 🐱 **GitHub** | `(repos públicos × 2) + total de stars` | 50 |
| 🤝 **Social** | Soma dos pesos das validações recebidas da rede | 50 |
| ⚡ **Atividade** | Semanas na plataforma + intenções cadastradas + validações dadas | 50 |

---

## Contribuindo

Pull requests são bem-vindos. Para mudanças grandes, abra uma issue primeiro.

```bash
git checkout -b feature/minha-feature
git commit -m "feat: descrição da feature"
git push origin feature/minha-feature
```

---

## Licença

Copyright (c) 2026 [Samuel dos Santos](https://github.com/SamuelSGSilva). All Rights Reserved.

Uso, cópia, modificação ou distribuição deste software sem autorização expressa e por escrito do autor é estritamente proibido. Veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">
  <sub>Feito com dedicação por quem já mandou mais de 50 currículos sem retorno — e decidiu construir a solução.</sub>
</div>
