
import os
from sqlalchemy import create_engine, inspect
import sys

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    target_tables = ['new_cars', 'insurances', 'dealer_full_payment_details', 'finance_record', 'vehicle']
    
    print(f"Checking specific tables in {DATABASE_URL}")
    print("-" * 30)
    
    existing_tables = inspector.get_table_names()
    
    for table in target_tables:
        if table in existing_tables:
            print(f"\nTable: {table}")
            columns = inspector.get_columns(table)
            for col in columns:
                print(f"  - {col['name']} ({col['type']})")
        else:
            print(f"\nTable '{table}' NOT FOUND")
            
except Exception as e:
    print(f"Error connecting to database: {e}")
    sys.exit(1)
