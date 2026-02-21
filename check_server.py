import requests
import json

url = "http://localhost:5000/api/inquiries"
# Known good payload from Step 1467
payload = {
    "customer": "Health Check User",
    "email": "health@example.com",
    "customerPhone": "1234567890",
    "vehicle": "Health Car",
    "contactMethod": "email",
    "notes": "Health Check",
    "source": "walk-in"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
