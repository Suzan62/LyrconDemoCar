import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_multi_table_vehicles():
    print("[INFO] Testing Multi-Table Vehicle Support...")
    try:
        resp = requests.get(f"{BASE_URL}/vehicles")
        if resp.status_code == 200:
            data = resp.json()
            print(f"[SUCCESS] Fetched {len(data)} total vehicles")
            
            # Count by transaction type
            new_count = sum(1 for v in data if v.get('transaction_type') == 'New')
            purchase_count = sum(1 for v in data if v.get('transaction_type') == 'Purchase')
            sale_count = sum(1 for v in data if v.get('transaction_type') == 'Sale')
            
            print(f"   New Cars: {new_count}")
            print(f"   Purchase (Old Cars): {purchase_count}")
            print(f"   Sale (Old Cars Sell): {sale_count}")
            
            # Show sample from each type
            if new_count > 0:
                sample_new = next((v for v in data if v.get('transaction_type') == 'New'), None)
                if sample_new:
                    print(f"\n   Sample New Car: {sample_new.get('manufacturer')} {sample_new.get('model')} (ID: {sample_new.get('id')})")
            
            if purchase_count > 0:
                sample_purchase = next((v for v in data if v.get('transaction_type') == 'Purchase'), None)
                if sample_purchase:
                    print(f"   Sample Purchase: {sample_purchase.get('manufacturer_name')} {sample_purchase.get('model_name')} (ID: {sample_purchase.get('id')})")
            
            if sale_count > 0:
                sample_sale = next((v for v in data if v.get('transaction_type') == 'Sale'), None)
                if sample_sale:
                    print(f"   Sample Sale: {sample_sale.get('manufacturer_name')} {sample_sale.get('model_name')} (ID: {sample_sale.get('id')})")
            
            return True
        else:
            print(f"[ERROR] Failed to fetch vehicles: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Could not connect to backend: {e}")
        return False

if __name__ == "__main__":
    time.sleep(2)  # Wait for server reload
    if test_multi_table_vehicles():
        sys.exit(0)
    else:
        sys.exit(1)
