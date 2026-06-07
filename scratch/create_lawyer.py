from app.database import Base, engine, SessionLocal
from app.models.user_model import User
from app.models.case_model import Case
from app.models.hearing_model import Hearing
from app.models.timeline_model import TimelineEvent
from app.models.notification_model import Notification
from app.models.document_model import Document
from app.services.auth_service import hash_password

db = SessionLocal()

email = "second_lawyer@example.com"
password = "LawyerPassword456!"
full_name = "Jane Doe"
role = "lawyer"
phone_number = "987-654-3210"

# Check if user already exists
existing_user = db.query(User).filter(User.email == email).first()
if existing_user:
    print(f"Lawyer already exists: {email}")
else:
    new_user = User(
        full_name=full_name,
        email=email,
        password=hash_password(password),
        role=role,
        phone_number=phone_number,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"Successfully created lawyer user {email} with id {new_user.id}")

db.close()
