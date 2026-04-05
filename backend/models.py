from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func
from database import Base
import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Float, Text, Boolean, DateTime

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
    
class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_name = Column(String(150), nullable=False)
    source = Column(String(50), default="github")  # github, manual, validation

class Validation(Base):
    __tablename__ = "validations"

    id = Column(Integer, primary_key=True, index=True)
    validator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_name = Column(String(150), nullable=False)
    weight = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)   # quem recebe
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # quem gerou
    type = Column(String(50), nullable=False)   # "skill_support", "match", etc.
    message = Column(String(300), nullable=False)
    read = Column(Integer, default=0)           # 0=nao lida, 1=lida
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Intention(Base):
    __tablename__ = "intentions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    embedding = Column(Vector(768)) # 768 dimensões do Google Gemini
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="intentions")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
 
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
