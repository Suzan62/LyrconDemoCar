import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_stats():
    print("[INFO] Checking Dashboard Stats API...")
    try:
        resp = requests.get(f"{BASE_URL}/dashboard/stats")
        if resp.status_code == 200:
            data = resp.json()
            print("[SUCCESS] Stats Fetched Successfully")
            print(f"   Total Vehicles: {data.get('totalVehicles')}")
            print(f"   Sold: {data.get('soldVehicles')}")
            print(f"   Revenue: {data.get('totalRevenue')}")
            return True
        else:
            print(f"[ERROR] Failed to fetch stats: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Could not connect to backend: {e}")
        return False

if __name__ == "__main__":
    time.sleep(2) # Wait for reload
    if test_stats():
        sys.exit(0)
    else:
        sys.exit(1)
