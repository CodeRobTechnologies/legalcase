import requests
from datetime import datetime, timedelta

base_url = 'http://127.0.0.1:8001'

def run_tests():
    # 1. Login
    print("Logging in...")
    login_url = f'{base_url}/auth/login'
    payload = {
        'username': 'lawyer@exaample.com',
        'password': 'lawyer123'
    }
    resp = requests.post(login_url, data=payload)
    if resp.status_code != 200:
        print("Login failed:", resp.text)
        return
    token = resp.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print("Logged in successfully. Token acquired.")

    # 2. Create a new Case with Client Details
    print("\nCreating Case with client details...")
    case_payload = {
        "case_title": "IP Protection Case",
        "case_description": "Copyright infringement action",
        "client_name": "John Doe",
        "client_mobile": "555-0199",
        "lawyer_id": 1
    }
    resp = requests.post(f'{base_url}/cases/', json=case_payload, headers=headers)
    assert resp.status_code == 200, f"Case creation failed: {resp.text}"
    case_id = resp.json()['case_id']
    print(f"Created Case ID: {case_id}")

    # 3. List Cases and verify details
    print("\nListing cases and verifying client details...")
    resp = requests.get(f'{base_url}/cases/', headers=headers)
    assert resp.status_code == 200, f"List cases failed: {resp.text}"
    cases = resp.json()
    created_case = [c for c in cases if c['id'] == case_id][0]
    print(f"Found case: Title={created_case['case_title']}, Client Name={created_case['client_name']}, Client Mobile={created_case['client_mobile']}")
    assert created_case['client_name'] == "John Doe", "Client name mismatch"
    assert created_case['client_mobile'] == "555-0199", "Client mobile mismatch"

    # 4. Update Case Client Details
    print("\nUpdating case client details...")
    update_payload = {
        "client_name": "John Doe Sr.",
        "client_mobile": "555-9999"
    }
    resp = requests.put(f'{base_url}/cases/{case_id}', json=update_payload, headers=headers)
    assert resp.status_code == 200, f"Update case failed: {resp.text}"
    
    resp = requests.get(f'{base_url}/cases/', headers=headers)
    created_case = [c for c in cases if c['id'] == case_id][0]
    # Fetch case individually to bypass caching or read individual endpoint
    resp = requests.get(f'{base_url}/cases/{case_id}', headers=headers)
    case_detail = resp.json()
    print(f"Updated Case: Client Name={case_detail['client_name']}, Client Mobile={case_detail['client_mobile']}")
    
    # 5. Create multiple Hearings with different dates
    print("\nScheduling multiple hearings to test date ordering...")
    # Delete existing hearings first to have a clean slate (optional but helpful)
    # We will schedule two hearings:
    # H1 on date T + 2 days
    # H2 on date T + 1 day
    t1 = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    t2 = (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
    
    h1_payload = {
        "case_id": case_id,
        "hearing_date": t1,
        "location": "Courtroom A",
        "status": "Scheduled"
    }
    resp = requests.post(f'{base_url}/hearings/', json=h1_payload, headers=headers)
    assert resp.status_code == 200, f"Hearing 1 creation failed: {resp.text}"
    h1_id = resp.json()['hearing_id']
    print(f"Scheduled Hearing 1 ID {h1_id} for date: {t1}")
    
    h2_payload = {
        "case_id": case_id,
        "hearing_date": t2,
        "location": "Courtroom B",
        "status": "Scheduled"
    }
    resp = requests.post(f'{base_url}/hearings/', json=h2_payload, headers=headers)
    assert resp.status_code == 200, f"Hearing 2 creation failed: {resp.text}"
    h2_id = resp.json()['hearing_id']
    print(f"Scheduled Hearing 2 ID {h2_id} for date: {t2}")

    # 6. Verify they are returned in ascending order by date
    print("\nFetching all hearings and verifying sorting order by date...")
    resp = requests.get(f'{base_url}/hearings/', headers=headers)
    assert resp.status_code == 200, f"Get hearings failed: {resp.text}"
    hearings = resp.json()
    
    # Filter only the hearings we created to test their relative ordering
    our_hearings = [h for h in hearings if h['id'] in (h1_id, h2_id)]
    print(f"Hearings returned in order:")
    for h in our_hearings:
        print(f"  - ID {h['id']}: Date={h['hearing_date']} Location={h['location']}")
        
    assert len(our_hearings) == 2, "Could not find scheduled hearings"
    assert our_hearings[0]['id'] == h2_id, "Hearings are not sorted in ascending order by date!"
    assert our_hearings[1]['id'] == h1_id, "Hearings are not sorted in ascending order by date!"
    print("\nSUCCESS! All tests passed successfully.")

if __name__ == '__main__':
    run_tests()
