import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_backend():
    print("[INFO] Checking Backend API Health...")
    
    # 1. Test Login
    try:
        login_resp = requests.post(f"{BASE_URL}/login", json={
            "email": "admin@lyrcon.com",
            "password": "password123"
        })
        
        if login_resp.status_code == 200:
            print("[SUCCESS] Login Successful")
        else:
            print(f"[ERROR] Login Failed: {login_resp.status_code} - {login_resp.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Could not connect to backend: {e}")
        return False

    # 2. Test Fetch Vehicles
    try:
        vehicles_resp = requests.get(f"{BASE_URL}/vehicles")
        if vehicles_resp.status_code == 200:
            vehicles = vehicles_resp.json()
            print(f"[SUCCESS] Fetched {len(vehicles)} vehicles")
        else:
            print(f"[ERROR] Failed to fetch vehicles: {vehicles_resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error fetching vehicles: {e}")
        return False

    return True

if __name__ == "__main__":
    time.sleep(2)
    if test_backend():
        sys.exit(0)
    else:
        sys.exit(1)
