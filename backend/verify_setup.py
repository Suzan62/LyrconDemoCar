import psycopg2
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

ALLOWED_TABLES = [
    'car_dealers', 'car_documents', 'cities', 'dealer_full_payment_details', 
    'dealer_payment_installments', 'executives', 'executive_branches', 
    'extra_charges', 'extra_charges_Sell', 'finances', 'full_payment_details', 
    'hire_purchase', 'inquiries', 'installments', 'insurancedocument', 
    'insurances', 'insurance_companies', 'insurance_payment', 'loan_details', 
    'manufacturers', 'models', 'new_cars', 'new_car_images', 'old_cars', 
    'old_cars_sell', 'old_car_buyers', 'old_car_images', 'payment_installments', 
    'remember_tokens', 'rto', 'rto_codes', 'sales', 'users', 'IF'
]

def verify_tables():
    print(f"Connecting to: {DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = [row[0] for row in cur.fetchall()]
        
        print("\n--- Current Tables in DB ---")
        for t in tables:
            print(f"- {t}")

        # Check for banned tables
        banned = ['vehicle', 'vehicle_document', 'finance_record']
        found_banned = [t for t in tables if t in banned]
        
        if found_banned:
            print(f"\n[FAIL] Found banned tables: {found_banned}")
        else:
            print("\n[ PASS ] No banned tables found.")

        # Check for required tables
        required = ['new_cars', 'car_documents', 'users', 'finances']
        missing = [t for t in required if t not in tables]
        
        if missing:
            print(f"\n[FAIL] Missing required tables: {missing}")
        else:
            print("\n[ PASS ] Required tables (new_cars, car_documents, etc.) are present.")
            
        # Optional: Check columns for 'users'
        if 'users' in tables:
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users'")
            columns = [row[0] for row in cur.fetchall()]
            print(f"\nUsers Columns: {columns}")
            if 'full_name' in columns:
                print("[ PASS ] 'users' table has 'full_name' column (Legacy Schema)")
            else:
                 print("[WARN] 'users' table MISSING 'full_name' column (Likely Old Schema)")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_tables()
