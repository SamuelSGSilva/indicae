from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Configuração de Nuvem (Prioriza DATABASE_URL unificada)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback para desenvolvimento local/Docker
    POSTGRES_USER = os.getenv("POSTGRES_USER", "indicae_admin")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "indicae_password")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "indicae_db")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(DATABASE_URL)

# Forçar a habilitação do vector no banco (requer permissão no postgres)
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    conn.commit()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependência do FastAPI para injeção de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
