
import os
from sqlalchemy import create_engine, inspect
import sys

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    table = 'new_cars'
    print(f"Checking {table} columns...")
    columns = [c['name'] for c in inspector.get_columns(table)]
    
    check_cols = ['delivery_date', 'booking_date', 'customer_dob', 'nominee_dob', 'buyer_dob', 'status', 'ex_showroom_price', 'price']
    
    for c in check_cols:
        if c in columns:
            print(f"[OK] {c} exists")
        else:
            print(f"[MISSING] {c}")
            
except Exception as e:
    print(f"Error: {e}")
