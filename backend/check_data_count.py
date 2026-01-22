
import os
from sqlalchemy import create_engine, text
import sys

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        count = conn.execute(text('SELECT COUNT(*) FROM new_cars')).scalar()
        print(f"Row count in new_cars: {count}")
except Exception as e:
    print(f"Error: {e}")
