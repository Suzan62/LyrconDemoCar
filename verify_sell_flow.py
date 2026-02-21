import requests
import json
import datetime

BASE_URL = "http://localhost:5000/api/vehicles"

def test_sell_flow():
    print("--- Testing Sell Old Car Flow ---")
    
    # 1. Add Sell Old Car
    payload = {
        "transaction_type": "Sale",
        "entry_type": "Sale", 
        "docket_number": "SELL-123",
        "customer_name": "Test Buyer",
        "customer_phone": "9988776655",
        "customer_email": "buyer@test.com",
        "manufacturer": "Maruti",
        "model": "Swift",
        "year": "2020",
        "registration_number": "MH12DE1234",
        "price": 500000,
        "buying_price": 450000,
        "renovation_cost": 10000,
        "status": "sold"
    }
    
    print("1. Creating Sell Entry...")
    try:
        resp = requests.post(BASE_URL, json=payload)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code != 201:
            print("FAILED to create sell entry.")
            return
        
        data = resp.json()
        vehicle_id = data['id']
        print(f"Created ID: {vehicle_id}")
        
    except Exception as e:
        print(f"Exception during create: {e}")
        return

    # 2. View Sell Old Car
    print(f"\n2. Viewing Sell Entry (ID: {vehicle_id}, type=Sale)...")
    try:
        resp = requests.get(f"{BASE_URL}/{vehicle_id}?type=Sale")
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            v_data = resp.json()
            print(f"Retrieved Data: {v_data.get('transaction_type')}, Model: {v_data.get('model')}")
            
            # Check if it hit the OldCarSell table or fallback
            # OldCarSell has 'buyer_name' mapped from 'customer_name', Vehicle has 'buyer_name' too.
            # But OldCarSell has 'hp_name', 'rto_code' etc.
            # Let's check transaction_type.
            if v_data.get('transaction_type') != 'Sale':
                print(f"WARNING: retrieved transaction_type is '{v_data.get('transaction_type')}', expected 'Sale'")
        else:
            print(f"FAILED to retrieve: {resp.text}")
            
    except Exception as e:
        print(f"Exception during view: {e}")

    # 3. Update Delivery Details (PUT)
    print(f"\n3. Updating Delivery Details (ID: {vehicle_id})...")
    update_payload = {
        "delivery_date": "2026-03-01",
        "other_remarks": "Updated delivery date"
    }
    try:
        resp = requests.put(f"{BASE_URL}/{vehicle_id}", json=update_payload)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Update successful.")
            # Verify update
            resp_gets = requests.get(f"{BASE_URL}/{vehicle_id}?type=Sale")
            print(f"Verified Remarks: {resp_gets.json().get('other_remarks')}")
        else:
            print(f"FAILED to update: {resp.text}")
    except Exception as e:
        print(f"Exception during update: {e}")

    # 4. Delete
    print(f"\n4. Deleting Entry (ID: {vehicle_id})...")
    try:
        resp = requests.delete(f"{BASE_URL}/{vehicle_id}")
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Delete successful.")
        else:
            print(f"FAILED to delete: {resp.text}")
    except Exception as e:
        print(f"Exception during delete: {e}")

if __name__ == "__main__":
    test_sell_flow()
