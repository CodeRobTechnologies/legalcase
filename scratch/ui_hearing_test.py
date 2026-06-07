import requests, time
BASE = "http://127.0.0.1:8001"

# Login
login_resp = requests.post(f"{BASE}/auth/login-json", json={"email": "lawyer@example.com", "password": "Password123!"})
login_resp.raise_for_status()
access = login_resp.json()["access_token"]
user_id = login_resp.json()["user"]["id"]
headers = {"Authorization": f"Bearer {access}", "Content-Type": "application/json"}

# 1. Create a Case (so we have a case to schedule hearing for)
case_data = {"case_title": "Hearing Test Case", "case_description": "Temporary Case", "lawyer_id": user_id}
create_case_resp = requests.post(f"{BASE}/cases/", json=case_data, headers=headers)
create_case_resp.raise_for_status()
case_id = create_case_resp.json()["case_id"]
print("Created Case ID:", case_id)

# 2. Create a Hearing
hearing_data = {
    "case_id": case_id,
    "hearing_date": "2026-07-06T10:00:00",
    "location": "Courtroom 3B",
    "status": "Scheduled"
}
create_hearing_resp = requests.post(f"{BASE}/hearings/", json=hearing_data, headers=headers)
create_hearing_resp.raise_for_status()
hearing_id = create_hearing_resp.json()["hearing_id"]
print("Scheduled Hearing ID:", hearing_id)

# 3. Update Hearing
update_data = {
    "case_id": case_id,
    "hearing_date": "2026-07-06T11:30:00",
    "location": "Courtroom 3B - Updated",
    "status": "Completed"
}
update_resp = requests.put(f"{BASE}/hearings/{hearing_id}", json=update_data, headers=headers)
update_resp.raise_for_status()
print("Updated Hearing Details")

# 4. Delete Hearing
del_hearing_resp = requests.delete(f"{BASE}/hearings/{hearing_id}", headers=headers)
del_hearing_resp.raise_for_status()
print("Deleted Hearing Successfully")

# 5. Clean up Case
del_case_resp = requests.delete(f"{BASE}/cases/{case_id}", headers=headers)
del_case_resp.raise_for_status()
print("Deleted Case Successfully")
