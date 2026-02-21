import requests
import json

url = "http://localhost:5000/api/inquiries"
# Exact payload structure from AddInquiry.jsx
payload = {
    "customer": "Frontend Repro User",
    "email": "repro@example.com",
    "customerPhone": "9876543210",
    "vehicle": "Repro Car",
    "carType": "NEW",             # Field sent by frontend but not used in backend
    "contactMethod": "Email",     # Capitalized from select option
    "notes": "",                  # Empty string
    "source": ""                  # Empty string
}
headers = {
    "Content-Type": "application/json"
}

print(f"Sending payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
