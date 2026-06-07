from app.database import Base, engine, SessionLocal
from app.models.user_model import User
from app.models.case_model import Case
from app.models.hearing_model import Hearing
from app.models.timeline_model import TimelineEvent
from app.models.notification_model import Notification
from app.models.document_model import Document
from app.services.auth_service import hash_password

# Recreate all tables
Base.metadata.create_all(bind=engine)

# Configuration
email = "lawyer@example.com"
password = "Password123!"
full_name = "Lawyer Example"
role = "lawyer"
phone_number = "123-456-7890"

# Create a new session
db = SessionLocal()

# Check if user already exists
existing_user = db.query(User).filter(User.email == email).first()
if existing_user:
    print(f"User already exists with id {existing_user.id}")
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
    print(f"Created user with id {new_user.id}")
# Additional seed for alternate credentials
if not db.query(User).filter(User.email == "lawyer@exaample.com").first():
    alt_user = User(
        full_name="Lawyer Example",
        email="lawyer@exaample.com",
        password=hash_password("lawyer123"),
        role="lawyer",
        phone_number="123-456-7890",
    )
    db.add(alt_user)
    db.commit()
    db.refresh(alt_user)
    print(f"Created alternate user with id {alt_user.id}")

db.close()
