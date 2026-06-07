import os, requests

url = 'http://127.0.0.1:8000/hearings/'
payload = {
    "case_id": 1,
    "hearing_date": "2024-12-02T10:00:00",
    "location": "Courtroom 2",
    "status": "Scheduled"
}
headers = {'Content-Type': 'application/json'}
resp = requests.post(url, json=payload, headers=headers)
print('Status code:', resp.status_code)
print('Response:', resp.text)
