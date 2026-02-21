import requests
import datetime

BASE_URL = "http://localhost:5000/api"

def verify_expiry():
    print("--- Verifying Dashboard Expiry Parsing ---")
    
    # 1. Create Insurance with 'Fri, 27 Feb 2026' format
    # Note: 27 Feb 2026 is > 30 days from now (2026-02-18).
    # Wait, dashboard logic: today <= expiry <= thirty_days_later
    # 27 Feb 2026 is tomorrow? No. 2026 is NEXT YEAR.
    # Ah, user screenshot says "Fri, 27 Feb 2026".
    # Current date is 2026-02-18.
    # Feb 27 is 9 days away.
    # So it SHOULD appear.
    
    target_date_str = "Fri, 27 Feb 2026"
    
    payload = {
        "customer_name": "Expiry Test User",
        "insurance_company": "Expiry Test Insurer",
        "amount": 1000,
        "bank_name": "Test Bank",
        "expiry_date": target_date_str
    }
    
    print(f"Creating insurance with expiry: {target_date_str}")
    res = requests.post(f"{BASE_URL}/insurances", json=payload)
    if res.status_code != 201:
        print(f"Failed to create: {res.text}")
        return
    
    ins_id = res.json()['insurance']['id']
    print(f"Created ID: {ins_id}")
    
    # 2. Check Dashboard
    print("Fetching Dashboard Stats...")
    res = requests.get(f"{BASE_URL}/dashboard/stats")
    if res.status_code != 200:
        print(f"Failed to fetch stats: {res.text}")
        return
        
    data = res.json()
    upcoming = data.get('upcomingInsurances', [])
    
    found = False
    for item in upcoming:
        # Check if ID matches #INS-{id} or #CAR-{id}
        # Since created without car_id, it should be #INS-{id}
        expected_id = f"#INS-{ins_id}"
        if item.get('car_id') == expected_id:
            print(f"[SUCCESS] Found record in dashboard: {item}")
            found = True
            break
            
    
    if not found:
        print("[FAILED] Record not found in upcoming insurances")
        print("Upcoming list:", upcoming)

    # 3. Create Insurance > 10 days away (e.g. 20 days)
    # Today 18 Feb. 20 days = ~10 Mar.
    target_date_far = "10 Mar 2026"
    print(f"Creating insurance with expiry > 10 days: {target_date_far}")
    payload['expiry_date'] = target_date_far
    res = requests.post(f"{BASE_URL}/insurances", json=payload)
    ins_id_far = res.json()['insurance']['id']
    
    print("Fetching Dashboard Stats again...")
    res = requests.get(f"{BASE_URL}/dashboard/stats")
    data = res.json()
    upcoming = data.get('upcomingInsurances', [])
    
    found_far = False
    for item in upcoming:
        if item.get('car_id') == f"#INS-{ins_id_far}":
             found_far = True
             break
    
    if found_far:
        print(f"[FAILED] Found record that should be hidden (expires in >10 days): #INS-{ins_id_far}")
    else:
        print(f"[SUCCESS] Record expiring > 10 days correctly HIDDEN: #INS-{ins_id_far}")

if __name__ == "__main__":
    verify_expiry()
