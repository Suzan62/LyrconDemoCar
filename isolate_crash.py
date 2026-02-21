import requests
import json

url = "http://localhost:5000/api/inquiries"
headers = {"Content-Type": "application/json"}

base_payload = {
    "customer": "Test User",
    "email": "test@example.com",
    "customerPhone": "1234567890",
    "vehicle": "Test Car",
    "contactMethod": "email",
    "notes": "Test Note",
    "source": "walk-in"
}

tests = [
    ("Test 1: Empty Source", {"source": ""}),
    ("Test 2: Empty Notes", {"notes": ""}),
    ("Test 3: Capitalized Contact", {"contactMethod": "Email"}),
    ("Test 4: Extra Field carType", {"carType": "NEW"}),
]

for name, modification in tests:
    print(f"\nRunning {name}...")
    current_payload = base_payload.copy()
    current_payload.update(modification)
    
    try:
        response = requests.post(url, json=current_payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 201:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"CRASH DETECTED: {e}")
