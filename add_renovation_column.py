
import os
import sys

# Add backend to path so we can import app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import app, db
from sqlalchemy import text

def run_migration():
    print("Starting migration...")
    with app.app_context():
        with db.engine.connect() as conn:
            # OldCar
            try:
                conn.execute(text("ALTER TABLE old_cars ADD COLUMN renovation_cost INTEGER DEFAULT 0"))
                print("SUCCESS: Added renovation_cost to old_cars")
            except Exception as e:
                print(f"SKIPPED old_cars: {e}")
            
            # OldCarSell
            try:
                conn.execute(text("ALTER TABLE old_cars_sell ADD COLUMN renovation_cost INTEGER DEFAULT 0"))
                print("SUCCESS: Added renovation_cost to old_cars_sell")
            except Exception as e:
                print(f"SKIPPED old_cars_sell: {e}")
            
            conn.commit()
    print("Migration complete.")

if __name__ == '__main__':
    run_migration()
