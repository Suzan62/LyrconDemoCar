
import os
from sqlalchemy import create_engine, text
import sys

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        count = conn.execute(text('SELECT COUNT(*) FROM finance_record')).scalar()
        print(f"Row count in finance_record: {count}")
        
        count_legacy = conn.execute(text('SELECT COUNT(*) FROM dealer_full_payment_details')).scalar()
        print(f"Row count in dealer_full_payment_details: {count_legacy}")

except Exception as e:
    print(f"Error: {e}")
