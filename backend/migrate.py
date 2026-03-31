import sqlalchemy
from database import engine

def migrate():
    with engine.connect() as conn:
        conn.execute(sqlalchemy.text('ALTER TABLE users ADD COLUMN bio TEXT;'))
        conn.commit()
    print("Success")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Already added or Error: {e}")
