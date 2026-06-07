import os

# Ensure DB URL is set (in case script run directly)
os.environ.setdefault('DATABASE_URL', 'sqlite:///./test.db')

from app.database import SessionLocal
from app.models.user_model import User
from app.services.auth_service import verify_password

session = SessionLocal()
user = session.query(User).filter(User.email == 'lawyer@example.com').first()
if not user:
    print('User not found')
else:
    print('User ID:', user.id)
    print('Stored hash:', user.password)
    print('Password correct?', verify_password('Password123!', user.password))
    print('Password wrong?', verify_password('WrongPass', user.password))
    session.close()
