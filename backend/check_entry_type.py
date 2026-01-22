
import os
from sqlalchemy import create_engine, text
import sys

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text('SELECT DISTINCT entry_type FROM new_cars'))
        types = [row[0] for row in result]
        print(f"Distinct entry_types: {types}")
except Exception as e:
    print(f"Error: {e}")
