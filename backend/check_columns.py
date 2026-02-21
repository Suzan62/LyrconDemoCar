
import os
from sqlalchemy import create_engine, inspect
import sys

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    table = 'old_cars'
    print(f"Checking {table} columns...")
    columns = [c['name'] for c in inspector.get_columns(table)]
    print(f"Columns: {columns}")
    
    check_cols = ['customer_name', 'buyer_name', 'seller_name', 'customer_phone', 'customer_address1', 'pincode', 'email', 'customer_dob']
    
    for c in check_cols:
        if c in columns:
            print(f"[OK] {c} exists")
        else:
            print(f"[MISSING] {c}")
            
except Exception as e:
    print(f"Error: {e}")
