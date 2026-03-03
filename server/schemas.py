from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class ReportOut(BaseModel):
    id: str
    user_id: str
    filename: str
    predicted_class: str
    confidence: float
    raw_prediction: list
    created_at: datetime
    image_base64: Optional[str] = None