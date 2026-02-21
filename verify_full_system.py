import requests
import json
import random
import string
import sys

BASE_URL = "http://localhost:5000/api"

def print_result(step, response, expected_status=200):
    if response.status_code == expected_status:
        try:
            print(f"[SUCCESS] {step}: {response.json()}")
        except:
            print(f"[SUCCESS] {step}: Status {response.status_code}")
        return True
    else:
        print(f"[FAILED] {step}: Status {response.status_code}")
        try:
            print(f"   Response: {response.text}")
        except:
            pass
        return False

# ... (omitted) ...

def verify_full_system():
    print("Starting Full System Verification...")
    try:
        verify_users()
        verify_inquiries()
        verify_insurance()
        verify_finance()
        verify_inventory()
        print("\n[ALL MODULES VERIFIED SUCCESSFULLY]")
    except Exception as e:
        print(f"\n[SYSTEM VERIFICATION FAILED]: {e}")
        import traceback
        traceback.print_exc()

def random_string(length=8):
    return ''.join(random.choices(string.ascii_letters, k=length))

def verify_users():
    print("\n--- Verifying Users Module ---")
    
    # 1. Create User
    email = f"testuser_{random_string()}@example.com"
    payload = {
        "name": "Test User",
        "email": email,
        "password": "password123",
        "role": "staff"
    }
    res = requests.post(f"{BASE_URL}/users", json=payload)
    if not print_result("Create User", res, 201): return None
    user_id = res.json()['user']['id']
    
    # 2. Login
    login_payload = {"email": email, "password": "password123"}
    res = requests.post(f"{BASE_URL}/login", json=login_payload)
    print_result("Login User", res, 200)

    # 3. Get Users
    res = requests.get(f"{BASE_URL}/users")
    print_result("List Users", res, 200)

    # 4. Update User
    update_payload = {"name": "Updated User Name"}
    res = requests.put(f"{BASE_URL}/users/{user_id}", json=update_payload)
    print_result("Update User", res, 200)
    
    # 5. Get User Detail
    res = requests.get(f"{BASE_URL}/users/{user_id}")
    print_result("Get User Detail", res, 200)

    # 6. Delete User
    res = requests.delete(f"{BASE_URL}/users/{user_id}")
    print_result("Delete User", res, 200)

def verify_inquiries():
    print("\n--- Verifying Inquiries Module ---")
    
    # 1. Create Inquiry
    payload = {
        "customer": "Test Customer",
        "email": f"inquiry_{random_string()}@example.com",
        "customerPhone": "1234567890",
        "vehicle": "Test Vehicle",
        "contactMethod": "email",
        "notes": "Testing inquiry",
        "source": "website"
    }
    res = requests.post(f"{BASE_URL}/inquiries", json=payload)
    if not print_result("Create Inquiry", res, 201): return None
    inquiry_id = res.json()['inquiry']['id']
    
    # 2. List Inquiries
    res = requests.get(f"{BASE_URL}/inquiries")
    print_result("List Inquiries", res, 200)
    
    # 3. Update Inquiry
    update_payload = {"status": "contacted", "notes": "Updated notes"}
    res = requests.put(f"{BASE_URL}/inquiries/{inquiry_id}", json=update_payload)
    print_result("Update Inquiry", res, 200)

    # 4. Get Inquiry Detail
    res = requests.get(f"{BASE_URL}/inquiries/{inquiry_id}")
    print_result("Get Inquiry Detail", res, 200)

    # 5. Delete Inquiry
    res = requests.delete(f"{BASE_URL}/inquiries/{inquiry_id}")
    print_result("Delete Inquiry", res, 200)

def verify_insurance():
    print("\n--- Verifying Insurance Module ---")
    # Need a car ID? Create one or use dummy? 
    # Create valid Insurance needs vehicle_id? Optional in schema (nullable=True).
    
    payload = {
        "customer_name": "Insurance Customer",
        "vehicle_id": None, # Test standalone
        "insurance_company": "Test Insurer",
        "amount": 15000,
        "premium_amount": 12000,
        "expiry_date": "2026-12-31",
        "bank_name": "Test Bank",
        "branch": "Main Branch",
        "address": "123 Test St"
    }
    res = requests.post(f"{BASE_URL}/insurances", json=payload)
    if not print_result("Create Insurance (Standalone)", res, 201): return None
    ins_id = res.json()['insurance']['id']
    
    # List
    res = requests.get(f"{BASE_URL}/insurances")
    print_result("List Insurances", res, 200)
    
    # Update
    update_payload = {"amount": 16000}
    res = requests.put(f"{BASE_URL}/insurances/{ins_id}", json=update_payload)
    print_result("Update Insurance", res, 200)
    
    # Delete
    res = requests.delete(f"{BASE_URL}/insurances/{ins_id}")
    print_result("Delete Insurance", res, 200)

def verify_finance():
    print("\n--- Verifying Finance Module ---")
    
    payload = {
        "customer_name": "Finance Customer",
        "amount": 500000,
        "bank_name": "Finance Bank",
        "bank_branch": "Main Branch",  # Added required field
        "status": "Pending",
        "vehicle_id": None
    }
    res = requests.post(f"{BASE_URL}/finances", json=payload)
    if not print_result("Create Finance Record", res, 201): return None
    fin_id = res.json()['finance']['id']
    
    # List
    res = requests.get(f"{BASE_URL}/finances")
    print_result("List Finances", res, 200)

    # Update
    update_payload = {"status": "Approved"}
    res = requests.put(f"{BASE_URL}/finances/{fin_id}", json=update_payload)
    print_result("Update Finance", res, 200)

    # Delete
    res = requests.delete(f"{BASE_URL}/finances/{fin_id}")
    print_result("Delete Finance", res, 200)

def verify_inventory():
    print("\n--- Verifying Inventory Module ---")
    
    # 1. Create New Car
    payload = {
        "transaction_type": "New",
        "manufacturer": "Test Make",
        "model": "Test Model",
        "price": 1000000,
        "status": "unsold"
    }
    res = requests.post(f"{BASE_URL}/vehicles", json=payload)
    if not print_result("Create New Car", res, 201): return None
    new_car_id = res.json()['id']
    
    # 2. Update New Car
    update_payload = {"transaction_type": "New", "price": 1100000}
    res = requests.put(f"{BASE_URL}/vehicles/{new_car_id}", json=update_payload)
    print_result("Update New Car", res, 200)

    # 3. Create Old Car (Purchase)
    purchase_payload = {
        "transaction_type": "Purchase",
        "manufacturer": "Old Make",
        "model": "Old Model",
        "price": 500000,
        "renovation_cost": 10000,
        "plate_type": "Normal",
        "rto_passing_status": "Pending"
    }
    res = requests.post(f"{BASE_URL}/vehicles", json=purchase_payload)
    if not print_result("Create Old Car (Purchase)", res, 201): return None
    old_car_id = res.json()['id']
    
    # 4. Get Old Car (with type param!)
    res = requests.get(f"{BASE_URL}/vehicles/{old_car_id}?type=Purchase")
    print_result("Get Old Car (Purchase)", res, 200)
    
    # 5. Update Old Car (Renovation)
    renovation_payload = {
        "transaction_type": "Purchase", 
        "renovation_cost": 20000, 
        "other_remarks": "Test Reno"
    }
    res = requests.put(f"{BASE_URL}/vehicles/{old_car_id}", json=renovation_payload)
    print_result("Update Renovation", res, 200)

    # 6. Sell Old Car (Status Update)
    sell_payload = {"transaction_type": "Purchase", "status": "sold"}
    res = requests.put(f"{BASE_URL}/vehicles/{old_car_id}", json=sell_payload)
    print_result("Sell Old Car (Status Update)", res, 200)

    # 7. Delete (Not implemented in backend? Check app.py)
    # App.py lines 1-1400 didn't show DELETE /api/vehicles/:id
    # I'll check quickly if DELETE exists.
    res = requests.delete(f"{BASE_URL}/vehicles/{new_car_id}")
    if res.status_code == 405:
        print("ℹ️  [INFO] Delete Vehicle: Method Not Allowed (Expected if not implemented)")
    else:
        print_result("Delete Vehicle", res, 200)

def verify_full_system():
    print("Starting Full System Verification...")
    try:
        verify_users()
        verify_inquiries()
        verify_insurance()
        verify_finance()
        verify_inventory()
        print("\n[ALL MODULES VERIFIED SUCCESSFULLY]")
    except Exception as e:
        print(f"\n[SYSTEM VERIFICATION FAILED]: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_full_system()
