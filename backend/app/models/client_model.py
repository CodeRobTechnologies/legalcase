from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=True)
    paid_amount = Column(Float, default=0.0, nullable=False)

    @property
    def phone_number(self):
        return self.mobile_number
