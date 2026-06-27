from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WorkCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to_id: int

class WorkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None

class WorkResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str
    assigned_to_id: int
    created_by_id: int
    assigned_to_name: Optional[str] = None
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True
