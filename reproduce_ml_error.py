
import requests
import sys

BASE_URL = "http://localhost:5000/api"

def run_test():
    print("--- STARTING ML FORECAST TEST ---")
    try:
        url = f"{BASE_URL}/ml/forecast"
        print(f"GET {url}")
        r = requests.get(url)
        
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.text}")

        if r.status_code == 500:
            print("Successfully reproduced 500 Error.")
        else:
            print("Did not reproduce 500 Error.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_test()
