from sqlalchemy import (

    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey
)

from sqlalchemy.sql import (
    func
)

from typing import Optional
from sqlalchemy.orm import relationship
from app.models.client_model import Client

from app.database import Base



class Case(Base):

    __tablename__ = "cases"



    # =========================
    # PRIMARY KEY
    # =========================

    id = Column(

        Integer,

        primary_key=True,

        index=True
    )



    # =========================
    # CASE DETAILS
    # =========================

    case_title = Column(

        String,

        nullable=False
    )



    case_number = Column(

        String,

        nullable=True
    )



    case_description = Column(

        Text,

        nullable=False
    )



    case_status = Column(

        String,

        default="Pending",

        nullable=False
    )



    # =========================
    # CLIENT & LAWYER
    # =========================




    client_id = Column(
        Integer,
        ForeignKey("clients.id"),
        nullable=True,
    )

    lawyer_id = Column(
        Integer,
        nullable=True,
    )



    # =========================
    # CREATED AT
    # =========================

    created_at = Column(

        DateTime(timezone=True),

        server_default=func.now()
    )



    # =========================
    # RELATIONSHIPS
    # =========================





    client = relationship(
        "Client",
        foreign_keys=[client_id]
    )

    @property
    def client_name(self) -> Optional[str]:
        return self.client.client_name if self.client else None

    @property
    def client_mobile(self) -> Optional[str]:
        return self.client.mobile_number if self.client else None



    # =========================
    # HEARINGS
    # =========================

    hearings = relationship(

        "Hearing",

        back_populates="case",

        cascade="all, delete-orphan"
    )



    # =========================
    # TIMELINE EVENTS
    # =========================

    timeline_events = relationship(

        "TimelineEvent",

        cascade="all, delete-orphan"
    )



    # =========================
    # DOCUMENTS
    # =========================

    documents = relationship(

        "Document",

        cascade="all, delete-orphan"
    )