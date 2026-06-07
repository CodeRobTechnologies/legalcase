import requests, time
BASE = "http://127.0.0.1:8001"
# Login
login_resp = requests.post(f"{BASE}/auth/login-json", json={"email": "lawyer@example.com", "password": "Password123!"})
login_resp.raise_for_status()
access = login_resp.json()["access_token"]
user_id = login_resp.json()["user"]["id"]
headers = {"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
# Create case
case_data = {"case_title": "UI Test Case", "case_description": "Created for UI verification", "lawyer_id": user_id}
create = requests.post(f"{BASE}/cases/", json=case_data, headers=headers)
create.raise_for_status()
case_id = create.json()["case_id"]
print("Created case", case_id)
# Wait a moment for UI to fetch
time.sleep(2)
# Update case title
update = {"case_title": "UI Test Case - Edited", "case_description": "Edited description", "case_status": "Open", "lawyer_id": user_id}
resp = requests.put(f"{BASE}/cases/{case_id}", json=update, headers=headers)
resp.raise_for_status()
print("Updated case title")
# Wait
time.sleep(2)
# Delete case
del_resp = requests.delete(f"{BASE}/cases/{case_id}", headers=headers)
print("Deleted case", del_resp.status_code)
