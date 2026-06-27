import os
from dotenv import load_dotenv
if os.path.exists("backend/.env"):
    load_dotenv("backend/.env")
else:
    load_dotenv()

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
email = os.getenv("SEED_USER_EMAIL", "lawyer@example.com")
password = os.getenv("SEED_USER_PASSWORD", "Password123!")
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
alt_email = os.getenv("SEED_ALT_USER_EMAIL", "lawyer@exaample.com")
alt_pass = os.getenv("SEED_ALT_USER_PASSWORD", "lawyer123")
if not db.query(User).filter(User.email == alt_email).first():
    alt_user = User(
        full_name="Lawyer Example",
        email=alt_email,
        password=hash_password(alt_pass),
        role="lawyer",
        phone_number="123-456-7890",
    )
    db.add(alt_user)
    db.commit()
    db.refresh(alt_user)
    print(f"Created alternate user with id {alt_user.id}")

# Create an admin user
admin_email = "admin@example.com"
admin_pass = "admin123"
admin_user = db.query(User).filter(User.email == admin_email).first()
if not admin_user:
    admin_user = User(
        full_name="Admin Lawyer",
        email=admin_email,
        password=hash_password(admin_pass),
        role="admin",
        phone_number="123-456-7890",
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    print(f"Created admin user with id {admin_user.id}")

# Link existing lawyers to first admin
if admin_user:
    lawyers = db.query(User).filter(User.email.in_(["lawyer@example.com", "lawyer@exaample.com"])).all()
    for l in lawyers:
        if l.admin_id is None:
            l.admin_id = admin_user.id
    db.commit()

# Create second admin user
admin2_email = "admin2@example.com"
admin2_pass = "admin123"
admin2_user = db.query(User).filter(User.email == admin2_email).first()
if not admin2_user:
    admin2_user = User(
        full_name="Second Admin Lawyer",
        email=admin2_email,
        password=hash_password(admin2_pass),
        role="admin",
        phone_number="123-456-7890",
    )
    db.add(admin2_user)
    db.commit()
    db.refresh(admin2_user)
    print(f"Created second admin user with id {admin2_user.id}")

# Create three assistants for the second admin
for i in range(1, 4):
    asst_email = f"assistant{i}_admin2@example.com"
    asst_pass = "assistant123"
    if not db.query(User).filter(User.email == asst_email).first():
        asst_user = User(
            full_name=f"Admin 2 Assistant {i}",
            email=asst_email,
            password=hash_password(asst_pass),
            role="lawyer",
            phone_number=f"123-456-789{i}",
            admin_id=admin2_user.id
        )
        db.add(asst_user)
        db.commit()
        db.refresh(asst_user)
        print(f"Created assistant {i} for admin2 with id {asst_user.id}")

db.close()

