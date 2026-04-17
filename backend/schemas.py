from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "b2c"
    github_username: Optional[str] = None
    bio: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class IntentionCreate(BaseModel):
    user_id: int
    intent_text: str

class IntentResponse(BaseModel):
    intent_text: str

class SkillResponse(BaseModel):
    name: str

class TrustDimensions(BaseModel):
    github: int = 0
    social: int = 0
    activity: int = 0

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    url: Optional[str]
    tech_stack: Optional[str]
    source: str = "manual"
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    tech_stack: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    github_username: Optional[str] = None
    role: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    trust_score: int
    trust_dimensions: TrustDimensions
    skills: list[str]
    intentions: list[str]
    badges: list[dict]
    projects: list[ProjectResponse] = []

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None

class CulturalFitRequest(BaseModel):
    culture_context: str
    candidates_ids: list[int]

class ValidationCreate(BaseModel):
    validator_id: int
    target_user_id: int
    skill_name: str
    weight: Optional[int] = 5


class ActivityActor(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ActivityResponse(BaseModel):
    id: int
    event_type: str
    skill_name: Optional[str] = None
    created_at: Optional[datetime] = None
    actor: ActivityActor
    target_user: Optional[ActivityActor] = None

    class Config:
        from_attributes = True
