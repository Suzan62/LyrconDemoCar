from sqlalchemy import create_engine, text
import os

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")
engine = create_engine(DATABASE_URL)

def add_columns():
    with engine.connect() as conn:
        print("Adding columns to 'insurances' table...")
        
        # Check if columns exist
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='insurances'"))
        columns = [row[0] for row in result.fetchall()]
        
        if 'old_policy_url' not in columns:
            conn.execute(text("ALTER TABLE insurances ADD COLUMN old_policy_url VARCHAR(255)"))
            print("Added old_policy_url")
        else:
            print("old_policy_url already exists")
            
        if 'new_policy_url' not in columns:
            conn.execute(text("ALTER TABLE insurances ADD COLUMN new_policy_url VARCHAR(255)"))
            print("Added new_policy_url")
        else:
            print("new_policy_url already exists")
            
        conn.commit()
        print("Schema update complete.")

if __name__ == "__main__":
    add_columns()
