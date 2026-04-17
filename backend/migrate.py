import sqlalchemy
from database import engine

def migrate():
    with engine.connect() as conn:
        # bio
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN bio TEXT;"))
            conn.commit()
            print("Coluna bio adicionada.")
        except Exception as e:
            conn.rollback()
            print(f"bio já existe ou erro: {e}")

        # avatar_url
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE users ADD COLUMN avatar_url TEXT;"))
            conn.commit()
            print("Coluna avatar_url adicionada.")
        except Exception as e:
            conn.rollback()
            print(f"avatar_url já existe ou erro: {e}")

        # tabela password_reset_tokens
        try:
            conn.execute(sqlalchemy.text("""
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    token VARCHAR UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("Tabela password_reset_tokens criada.")
        except Exception as e:
            conn.rollback()
            print(f"password_reset_tokens já existe ou erro: {e}")

        # tabela user_skills
        try:
            conn.execute(sqlalchemy.text("""
                CREATE TABLE IF NOT EXISTS user_skills (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    skill_name VARCHAR NOT NULL,
                    source VARCHAR DEFAULT 'github',
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("Tabela user_skills criada.")
        except Exception as e:
            conn.rollback()
            print(f"user_skills já existe ou erro: {e}")

        # tabela validations
        try:
            conn.execute(sqlalchemy.text("""
                CREATE TABLE IF NOT EXISTS validations (
                    id SERIAL PRIMARY KEY,
                    validator_id INTEGER NOT NULL REFERENCES users(id),
                    target_user_id INTEGER NOT NULL REFERENCES users(id),
                    skill_name VARCHAR NOT NULL,
                    weight INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("Tabela validations criada.")
        except Exception as e:
            conn.rollback()
            print(f"validations já existe ou erro: {e}")

        # tabela notifications
        try:
            conn.execute(sqlalchemy.text("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    actor_id INTEGER REFERENCES users(id),
                    type VARCHAR NOT NULL,
                    message TEXT NOT NULL,
                    read INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("Tabela notifications criada.")
        except Exception as e:
            conn.rollback()
            print(f"notifications já existe ou erro: {e}")

        # tabela activities
        try:
            conn.execute(sqlalchemy.text("""
                CREATE TABLE IF NOT EXISTS activities (
                    id SERIAL PRIMARY KEY,
                    actor_id INTEGER REFERENCES users(id),
                    target_user_id INTEGER REFERENCES users(id),
                    event_type VARCHAR(50) NOT NULL,
                    skill_name VARCHAR(100),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """))
            conn.commit()
            print("Tabela activities criada.")
        except Exception as e:
            conn.rollback()
            print(f"activities já existe ou erro: {e}")

        # tabela user_projects
        try:
            conn.execute(sqlalchemy.text("""
                CREATE TABLE IF NOT EXISTS user_projects (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    title VARCHAR(100) NOT NULL,
                    description VARCHAR(500),
                    url VARCHAR(300),
                    tech_stack VARCHAR(200),
                    source VARCHAR(20) DEFAULT 'manual',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """))
            conn.commit()
            print("Tabela user_projects criada.")
        except Exception as e:
            conn.rollback()
            print(f"user_projects já existe ou erro: {e}")

        # coluna source em user_projects (caso tabela já existia sem ela)
        try:
            conn.execute(sqlalchemy.text(
                "ALTER TABLE user_projects ADD COLUMN source VARCHAR(20) DEFAULT 'manual';"
            ))
            conn.commit()
            print("Coluna source adicionada em user_projects.")
        except Exception as e:
            conn.rollback()
            print(f"source já existe ou erro: {e}")

    print("Migração concluída.")

if __name__ == "__main__":
    migrate()
