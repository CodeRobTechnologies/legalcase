from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HearingCreate(BaseModel):

    case_id: int

    hearing_date: datetime

    location: str

    status: Optional[str] = "Scheduled"


class HearingResponse(BaseModel):

    id: int

    case_id: int

    hearing_date: datetime

    location: str

    status: str

    class Config:

        from_attributes = True