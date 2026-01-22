
import os
from sqlalchemy import create_engine, text
import sys

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text('SELECT DISTINCT status FROM new_cars'))
        statuses = [row[0] for row in result]
        print(f"Distinct values in 'status' column: {statuses}")
except Exception as e:
    print(f"Error: {e}")
