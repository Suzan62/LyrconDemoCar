import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_dashboard_stats():
    print("[INFO] Testing Dashboard Stats API...")
    try:
        resp = requests.get(f"{BASE_URL}/dashboard/stats")
        if resp.status_code == 200:
            data = resp.json()
            print("[SUCCESS] Dashboard Stats Fetched Successfully")
            print(f"\n   API Response:")
            print(f"   - Total Revenue: ${data.get('totalRevenue', 0):,}")
            print(f"   - Sold Vehicles: {data.get('soldVehicles', 0)}")
            print(f"   - Available Vehicles: {data.get('availableVehicles', 0)}")
            print(f"   - Total Inquiries: {data.get('totalInquiries', 0)}")
            print(f"   - Pending Inquiries: {data.get('pendingInquiries', 0)}")
            
            # Verify all required fields are present
            required_fields = ['totalRevenue', 'soldVehicles', 'totalInquiries']
            missing = [f for f in required_fields if f not in data]
            
            if missing:
                print(f"\n[WARNING] Missing fields: {missing}")
                return False
            
            return True
        else:
            print(f"[ERROR] Failed to fetch stats: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Could not connect to backend: {e}")
        return False

if __name__ == "__main__":
    time.sleep(2)
    if test_dashboard_stats():
        sys.exit(0)
    else:
        sys.exit(1)
