from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")
engine = create_engine(DATABASE_URL)

def drop_constraints():
    with engine.connect() as conn:
        print("Dropping constraints on old_cars_sell...")
        try:
            conn.execute(text("ALTER TABLE old_cars_sell DROP CONSTRAINT IF EXISTS old_cars_sell_number_plate_check;"))
            print("Dropped old_cars_sell_number_plate_check")
        except Exception as e:
            print(f"Error dropping number_plate check: {e}")

        try:
            conn.execute(text("ALTER TABLE old_cars_sell DROP CONSTRAINT IF EXISTS old_cars_sell_parsing_status_check;"))
            print("Dropped old_cars_sell_parsing_status_check")
        except Exception as e:
            print(f"Error dropping parsing_status check: {e}")
            
        conn.commit()
        print("Done.")

if __name__ == "__main__":
    drop_constraints()
