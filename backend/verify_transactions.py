import requests
import os

BASE_URL = "http://localhost:5000/api/vehicles"

def test_add_new_car():
    print("\n--- Testing Add New Car ---")
    payload = {
        "transaction_type": "New",
        "docket_number": "D-NEW-001",
        "vin": "VIN-NEW-001",
        "manufacturer": "Tata",
        "model": "Nexon",
        "year": "2024",
        "color": "Red",
        "delivery_date": "2024-12-30",
        "executive_name": "John Doe",
        "rto_passing_status": "Pending"
    }
    try:
        response = requests.post(BASE_URL, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Failed: {e}")

def test_purchase_old_car():
    print("\n--- Testing Purchase Old Car (With Files) ---")
    
    # Create dummy files
    files = {}
    for doc in ['RC_Book', 'Insurance', 'PAN']:
        filename = f"dummy_{doc}.txt"
        with open(filename, 'w') as f:
            f.write(f"Content for {doc}")
        files[doc] = (filename, open(filename, 'rb'))

    payload = {
        "transaction_type": "Purchase",
        "docket_number": "D-OLD-PUR-001",
        "vin": "VIN-OLD-PUR-001",
        "manufacturer": "Maruti",
        "model": "Swift",
        "year": "2020",
        "running_km": "45000",
        "rto_passing_status": "Completed"
    }
    
    try:
        response = requests.post(BASE_URL, data=payload, files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Failed: {e}")
    finally:
        # Cleanup
        for f in files.values():
            f[1].close()
        for doc in ['RC_Book', 'Insurance', 'PAN']:
            try:
                os.remove(f"dummy_{doc}.txt")
            except:
                pass


def test_sell_old_car():
    print("\n--- Testing Sell Old Car ---")
    payload = {
        "transaction_type": "Sale",
        "docket_number": "D-OLD-SALE-001",
        "vin": "VIN-OLD-SALE-001",
        "manufacturer": "Hyundai",
        "model": "Creta",
        "year": "2022",
        "running_km": "20000",
        "buyer_name": "Jane Doe",
        "buyer_address": "123 Main St",
        "broker_name": "Best Broker",
        "brokerage_amount": "5000"
    }
    try:
        response = requests.post(BASE_URL, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Failed: {e}")

def test_vin_decode():
    print("\n--- Testing VIN Decode ---")
    # Sample Tesla VIN (randomly picked from public examples or just a known one)
    # 5YJ3E1EA0KFxxxxxx - 2019 Tesla Model 3
    # Use a real valid VIN for best test, but let's try a sample (NHTSA might work with partials if we are lucky, but usually needs full)
    # Using a sample valid VIN from Wikipedia or similar resource is safer.
    test_vin = "5YJ3E1EA6KF555555" # Example format
    try:
        response = requests.get(f"http://localhost:5000/api/decode-vin/{test_vin}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Failed: {e}")

def main():
    print("Ensure backend is running on port 5000...")

    # You might want to check if backend is reachable first
    try:
        requests.get("http://localhost:5000/api/profile?email=test") # Just a check
    except:
        print("Backend might not be running. Please start it.")
    
    test_add_new_car()
    test_purchase_old_car()
    test_sell_old_car()
    test_vin_decode()

if __name__ == "__main__":
    main()
