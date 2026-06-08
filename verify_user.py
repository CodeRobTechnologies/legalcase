import os
from dotenv import load_dotenv
load_dotenv()

# Ensure DB URL is set (in case script run directly)
os.environ.setdefault('DATABASE_URL', 'sqlite:///./test.db')

from app.database import SessionLocal
from app.models.user_model import User
from app.services.auth_service import verify_password

session = SessionLocal()
email = os.getenv("SEED_USER_EMAIL", "lawyer@example.com")
password = os.getenv("SEED_USER_PASSWORD", "Password123!")

user = session.query(User).filter(User.email == email).first()
if not user:
    print('User not found')
else:
    print('User ID:', user.id)
    print('Stored hash:', user.password)
    print('Password correct?', verify_password(password, user.password))
    print('Password wrong?', verify_password('WrongPass', user.password))
    session.close()

