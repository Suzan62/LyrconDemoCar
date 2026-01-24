import os
import sys
from sqlalchemy import text

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import app, db

SQL_FILE_PATH = os.path.join(os.path.dirname(__file__), "parivar_postgres_compatible (7).sql")

def seed_data():
    if not os.path.exists(SQL_FILE_PATH):
        print(f"❌ File not found: {SQL_FILE_PATH}")
        return False

    print(f"✓ Found SQL file: {SQL_FILE_PATH}")
    print("📖 Reading SQL file...")
    
    with open(SQL_FILE_PATH, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"✓ File size: {len(sql_content)} characters")

    with app.app_context():
        print("\n🔧 Dropping all existing tables...")
        try:
            db.drop_all()
            print("✓ All tables dropped")
        except Exception as e:
            print(f"⚠ Warning dropping tables: {e}")
        
        print("\n📦 Executing full SQL file...")
        try:
            # Execute the entire SQL file at once
            # Split into statements but handle transactions properly
            statements = [s.strip() for s in sql_content.split(';') if s.strip()]
            
            total = len(statements)
            print(f"Found {total} SQL statements")
            
            success_count = 0
            error_count = 0
            
            for i, stmt in enumerate(statements, 1):
                if not stmt:
                    continue
                    
                try:
                    db.session.execute(text(stmt))
                    success_count += 1
                    
                    # Progress indicator
                    if i % 100 == 0:
                        print(f"Progress: {i}/{total} statements ({success_count} successful, {error_count} errors)")
                        db.session.commit()  # Commit in batches
                        
                except Exception as e:
                    error_count += 1
                    error_msg = str(e)
                    
                    # Skip common errors that are okay
                    if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower():
                        continue
                    
                    # Show first 100 chars of problematic statement
                    print(f"⚠ Error at statement {i}: {stmt[:100]}...")
                    print(f"   Error: {error_msg[:200]}")
                    
                    # Continue with next statement
                    continue
            
            # Final commit
            db.session.commit()
            
            print(f"\n✅ Seeding completed!")
            print(f"   Total statements: {total}")
            print(f"   Successful: {success_count}")
            print(f"   Errors: {error_count}")
            
            # Verify data
            print("\n🔍 Verifying seeded data:")
            tables = db.session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public';")).fetchall()
            print(f"   Tables created: {len(tables)}")
            
            for table in tables:
                table_name = table[0]
                count = db.session.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
                if count > 0:
                    print(f"   - {table_name}: {count} rows")
            
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Critical Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    print("="*60)
    print("🌱 LyrconCar Database Seeding Script")
    print("="*60)
    success = seed_data()
    if success:
        print("\n✅ Database seeding completed successfully!")
    else:
        print("\n❌ Database seeding failed!")
    print("="*60)
