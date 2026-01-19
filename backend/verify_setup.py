import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_backend():
    print("[INFO] Checking Backend Health...")
    
    # 1. Test Login
    try:
        login_resp = requests.post(f"{BASE_URL}/login", json={
            "email": "admin@lyrcon.com",
            "password": "password123"
        })
        
        if login_resp.status_code == 200:
            print("[SUCCESS] Login Successful")
            print(f"   User: {login_resp.json()['user']['email']}")
        else:
            print(f"[ERROR] Login Failed: {login_resp.status_code} - {login_resp.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Could not connect to backend: {e}")
        return False

    # 2. Test Data (Vehicles)
    try:
        vehicles_resp = requests.get(f"{BASE_URL}/vehicles")
        if vehicles_resp.status_code == 200:
            vehicles = vehicles_resp.json()
            count = len(vehicles)
            print(f"[SUCCESS] Data Verification Successful")
            print(f"   Total Vehicles Found: {count}")
            
            if count > 0:
                print(f"   Sample Vehicle: {vehicles[0].get('year')} {vehicles[0].get('manufacturer')} {vehicles[0].get('model')}")
            
            if count > 150:
                 print("[SUCCESS] Data count matches expected import size (>150)")
            else:
                 print("[WARNING] Data count is lower than expected (Check import?)")
                 
        else:
            print(f"[ERROR] Failed to fetch vehicles: {vehicles_resp.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error fetching vehicles: {e}")
        return False
        
    return True

if __name__ == "__main__":
    # Wait a bit for server to start if run immediately after
    time.sleep(2)
    if test_backend():
        sys.exit(0)
    else:
        sys.exit(1)
