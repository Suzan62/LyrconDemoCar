import requests
import os

BASE_URL = "http://localhost:5000/api"

def print_result(step, response):
    if response.status_code in [200, 201]:
        print(f"[SUCCESS] {step}: {response.json()}")
    else:
        print(f"[FAILED] {step}: Status {response.status_code}")
        try:
            print(response.json())
        except:
            print(response.text)

def verify_upload():
    print("--- Verifying Insurance Document Upload ---")
    
    # 1. Create dummy file
    with open("test_policy.txt", "w") as f:
        f.write("This is a test policy document.")
        
    # 2. Upload File
    files = {'file': open('test_policy.txt', 'rb')}
    response = requests.post(f"{BASE_URL}/upload", files=files)
    print_result("Upload File", response)
    
    if response.status_code != 200:
        return
    
    file_url = response.json().get('url')
    print(f"Uploaded URL: {file_url}")
    
    # 3. Get existing insurance (or create one)
    # create new one to be safe
    payload = {
        "customer_name": "Upload Test User",
        "insurance_company": "Test Insurer",
        "amount": 1000,
        "bank_name": "Test Bank",
        "expiry_date": "2026-12-31"
    }
    res = requests.post(f"{BASE_URL}/insurances", json=payload)
    if res.status_code != 201:
        print("Failed to create insurance")
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        return
        
    ins_id = res.json()['insurance']['id']
    print(f"Created Insurance ID: {ins_id}")
    
    # 4. Link file to insurance
    update_payload = {
        "old_policy_url": file_url,
        "new_policy_url": file_url
    }
    res = requests.put(f"{BASE_URL}/insurances/{ins_id}", json=update_payload)
    print_result("Update Insurance with URLs", res)
    
    # 5. Verify Get
    res = requests.get(f"{BASE_URL}/insurances/{ins_id}")
    data = res.json()
    if data.get('old_policy_url') == file_url:
        print("[SUCCESS] Verified URL persistence")
    else:
        print(f"[FAILED] URL mismatch. Expected {file_url}, Got {data.get('old_policy_url')}")
        
    # Cleanup
    os.remove("test_policy.txt")

if __name__ == "__main__":
    verify_upload()
