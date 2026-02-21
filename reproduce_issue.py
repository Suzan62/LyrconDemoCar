
import requests
import json
import sys

BASE_URL = "http://localhost:5000/api"

def run_test():
    print("--- STARTING UPDATE TEST ---")
    
    # 1. Find a Purchase vehicle
    try:
        r = requests.get(f"{BASE_URL}/vehicles")
        if r.status_code != 200:
            print(f"Failed to fetch vehicles: {r.status_code}")
            return
        
        vehicles = r.json()
        target = None
        for v in vehicles:
            if v.get('transaction_type') == 'Purchase':
                target = v
                break
        
        if not target:
            print("No 'Purchase' vehicle found to test.")
            # Helper: Create one if missing? For now just exit
            return

        print(f"Target identified: ID {target['id']} (Current Name: {target.get('buyer_name')})")

        # 2. Update it
        update_payload = {
            "transaction_type": "Purchase",
            "customer_name": "UPDATED_BY_SCRIPT_V2",
            "buyer_name": "UPDATED_BY_SCRIPT_V2", # Send both to be sure
            "model": target.get('model', 'Unknown'),
            # minimal fields
        }

        print(f"Sending PUT to {BASE_URL}/vehicles/{target['id']}...")
        r_update = requests.put(f"{BASE_URL}/vehicles/{target['id']}", json=update_payload)
        
        if r_update.status_code != 200:
            print(f"Update failed: {r_update.status_code}")
            print(r_update.text)
            return
        
        print("Update response OK.")
        
        # 3. Verify
        print("Verifying update...")
        r_verify = requests.get(f"{BASE_URL}/vehicles/{target['id']}?type=Purchase")
        updated_data = r_verify.json()
        
        new_name = updated_data.get('vehicle', {}).get('buyer_name')
        print(f"New Name in DB: {new_name}")
        
        if new_name == "UPDATED_BY_SCRIPT_V2":
            print("SUCCESS: Backend update logic is working!")
        else:
            print("FAILURE: Backend did not persist the change.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_test()
