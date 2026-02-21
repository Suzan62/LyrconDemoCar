from sqlalchemy import create_engine, text, inspect
import os

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")
engine = create_engine(DATABASE_URL)

def fix_constraints():
    with engine.connect() as conn:
        print("--- Checking Constraints on 'new_cars' ---")
        inspector = inspect(engine)
        constraints = inspector.get_check_constraints('new_cars')
        for c in constraints:
            print(f"Constraint: {c['name']} - {c['sqltext']}")
            
        # Drop strict constraints preventing 'New' entry_type
        # The error was: violates check constraint "new_cars_entry_type_check"
        try:
            print("\nDropping 'new_cars_entry_type_check'...")
            conn.execute(text("ALTER TABLE new_cars DROP CONSTRAINT IF EXISTS new_cars_entry_type_check"))
            conn.commit()
            print("Dropped 'new_cars_entry_type_check'.")
        except Exception as e:
            print(f"Error dropping constraint: {e}")

if __name__ == "__main__":
    fix_constraints()
