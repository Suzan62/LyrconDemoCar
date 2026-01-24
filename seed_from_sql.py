
import os
import re
from sqlalchemy import text
from backend.app import app, db

SQL_FILE_PATH = r"c:\Users\DELL\.gemini\antigravity\scratch\lyrcon-replica\parivar_postgres_compatible (7).sql"

def seed_data():
    if not os.path.exists(SQL_FILE_PATH):
        print(f"File not found: {SQL_FILE_PATH}")
        return

    print("Reading SQL file...")
    with open(SQL_FILE_PATH, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Extract INSERT statements
    # This regex looks for INSERT INTO ... ;
    # It accounts for multi-line values and quoted identifiers.
    # Note: Complex SQL parsing with regex is fragile, but for a standard dump it usually works.
    
    # We will split by semicolon to get statements, then filter for inserts
    statements = sql_content.split(';')
    
    insert_statements = []
    for stmt in statements:
        stmt = stmt.strip()
        if stmt.upper().startswith("INSERT INTO"):
            insert_statements.append(stmt + ";")

    print(f"Found {len(insert_statements)} INSERT statements.")

    with app.app_context():
        print("Creating tables if they don't exist...")
        db.create_all()
        
        print("Executing INSERT statements...")
        try:
            # Disable foreign key checks temporarily if possible (Postgres specific)
            # db.session.execute(text("SET session_replication_role = 'replica';")) 
            
            count = 0
            for stmt in insert_statements:
                try:
                    # Clean up statement if needed
                    # SQL dumps often have schema prefixes or specific syntax we might need to adjust
                    # But if it's "postgres compatible" it should run directly via text()
                    
                    db.session.execute(text(stmt))
                    count += 1
                    if count % 50 == 0:
                        print(f"Executed {count} statements...")
                except Exception as e:
                    print(f"Error executing statement start: {stmt[:50]}...")
                    print(f"Error: {e}")
                    # Decide if we want to stop or continue. 
                    # For duplicate keys, we might want to continue.
                    continue
            
            # Re-enable checks
            # db.session.execute(text("SET session_replication_role = 'origin';"))
            
            db.session.commit()
            print("Seeding completed successfully.")
            
        except Exception as e:
            db.session.rollback()
            print(f"Critical Error during seeding: {e}")

if __name__ == "__main__":
    seed_data()
