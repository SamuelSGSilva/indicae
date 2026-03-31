from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="b2c") # b2c (especialista) ou b2b (empresa)
    github_username = Column(String(100), nullable=True) # ADICIONADO PARA O PROCESSO DE PULL DE SKILLS
    bio = Column(String, nullable=True) # Novo campo para Fase 6: Match Cultural # ADICIONADO PARA O PROCESSO DE PULL DE SKILLS
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    intentions = relationship("Intention", back_populates="user")
    
class Intention(Base):
    __tablename__ = "intentions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    embedding = Column(Vector(768)) # 768 dimensões do Google Gemini
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="intentions")
