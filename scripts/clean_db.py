import os
import psycopg2
from urllib.parse import urlparse

# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")
DATABASE_URL = "postgresql://postgres:root@localhost:5432/LyrconCar"

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

def clean_database():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Get all current tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        current_tables = [row[0] for row in cur.fetchall()]
        
        print("Current tables:", current_tables)
        
        tables_to_drop = [t for t in current_tables if t not in ALLOWED_TABLES]
        
        if not tables_to_drop:
            print("No extra tables found. Database is clean.")
        else:
            print(f"Dropping tables: {tables_to_drop}")
            for table in tables_to_drop:
                print(f"Dropping {table}...")
                # CASCADE is important to remove foreign key constraints linking to this table
                cur.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
            
            conn.commit()
            print("Cleanup complete.")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error cleaning database: {e}")

if __name__ == "__main__":
    clean_database()
