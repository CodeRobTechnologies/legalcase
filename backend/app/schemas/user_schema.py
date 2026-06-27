from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone_number: str
    role: Optional[str] = "lawyer"
    admin_id: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    phone_number: str
    admin_id: Optional[int] = None

    class Config:
        from_attributes = True