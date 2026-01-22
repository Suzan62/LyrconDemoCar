
import os
from sqlalchemy import create_engine, inspect
import sys

# DATABASE_URL = "postgresql://postgres:root@localhost:5432/LyrconCar"
# Try environment variable first, then fallback
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    print(f"Connected to {DATABASE_URL}")
    print("-" * 30)
    
    tables = inspector.get_table_names()
    print(f"Found {len(tables)} tables:")
    for table in tables:
        print(f"\nTable: {table}")
        columns = inspector.get_columns(table)
        for col in columns:
            print(f"  - {col['name']} ({col['type']})")
            
except Exception as e:
    print(f"Error connecting to database: {e}")
    sys.exit(1)
