import os
import requests
from dotenv import load_dotenv
load_dotenv()

# Ensure the DB URL is set (optional when running directly)
os.environ.setdefault('DATABASE_URL', 'sqlite:///./test.db')

# FastAPI login endpoint
login_url = 'http://127.0.0.1:8000/auth/login'

email = os.getenv("SEED_ALT_USER_EMAIL", "lawyer@exaample.com")
password = os.getenv("SEED_ALT_USER_PASSWORD", "lawyer123")

payload = {
    'username': email,
    'password': password
}

response = requests.post(login_url, json=payload)
print('Status code:', response.status_code)
try:
    json_resp = response.json()
    print('Response JSON:', json_resp)
except Exception:
    print('Response text:', response.text)

