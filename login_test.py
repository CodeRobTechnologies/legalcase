import os
import requests

# Ensure the DB URL is set (optional when running directly)
os.environ.setdefault('DATABASE_URL', 'sqlite:///./test.db')

# FastAPI login endpoint
login_url = 'http://127.0.0.1:8000/auth/login'

payload = {
    'username': 'lawyer@exaample.com',
    'password': 'lawyer123'
}

response = requests.post(login_url, data=payload)
print('Status code:', response.status_code)
try:
    json_resp = response.json()
    print('Response JSON:', json_resp)
except Exception:
    print('Response text:', response.text)
