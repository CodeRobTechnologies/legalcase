from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Create Case Schema
class CaseCreate(BaseModel):
    case_title: str
    case_description: str
    case_number: Optional[str] = None
    lawyer_id: Optional[int] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    client_mobile: Optional[str] = None


# Update Case Schema
class CaseUpdate(BaseModel):
    case_title: Optional[str] = None
    case_description: Optional[str] = None
    case_number: Optional[str] = None
    case_status: Optional[str] = None
    lawyer_id: Optional[int] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    client_mobile: Optional[str] = None


# Response Schema
class CaseResponse(BaseModel):
    id: int
    case_title: str
    case_description: str
    case_number: Optional[str] = None
    case_status: str

    lawyer_id: Optional[int] = None
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    client_mobile: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True