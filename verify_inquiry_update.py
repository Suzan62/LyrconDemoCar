import requests
import json

base_url = "http://localhost:5000/api/inquiries"
headers = {"Content-Type": "application/json"}

# 1. Create a new inquiry
create_payload = {
    "customer": "Update Test User",
    "email": "update@example.com",
    "customerPhone": "1122334455",
    "vehicle": "Old Car",
    "contactMethod": "email",
    "notes": "Original Note",
    "source": "walk-in"
}

print("Creating Inquiry...")
try:
    resp = requests.post(base_url, json=create_payload, headers=headers)
    if resp.status_code != 201:
        print(f"Failed to create: {resp.text}")
        exit(1)
    inquiry_id = resp.json()['inquiry']['id']
    print(f"Created Inquiry ID: {inquiry_id}")
except Exception as e:
    print(f"Error creating: {e}")
    exit(1)

# 2. Update the inquiry
update_payload = {
    "customer": "Updated User Name",
    "email": "updated@example.com",
    "notes": "Updated Note",
    "status": "completed"
}
print(f"Updating Inquiry ID {inquiry_id}...")
try:
    resp = requests.put(f"{base_url}/{inquiry_id}", json=update_payload, headers=headers)
    if resp.status_code != 200:
        print(f"Failed to update: {resp.text}")
        exit(1)
    updated_data = resp.json()['inquiry']
    print("Update successful.")
    
    # Verify fields
    assert updated_data['customer'] == "Updated User Name"
    assert updated_data['email'] == "updated@example.com"
    assert updated_data['notes'] == "Updated Note"
    assert updated_data['status'] == "completed"
    print("Verification Passed!")

except Exception as e:
    print(f"Error updating: {e}")
    exit(1)
