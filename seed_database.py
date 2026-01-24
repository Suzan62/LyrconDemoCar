import os
import sys
import re
from sqlalchemy import text

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import app, db

SQL_FILE_PATH = os.path.join(os.path.dirname(__file__), "parivar_postgres_compatible (7).sql")

def fix_sql_quotes(sql_content):
    """Fix common SQL quote issues"""
    # Fix unterminated strings by ensuring quotes are balanced
    lines = sql_content.split('\n')
    fixed_lines = []
    
    for line in lines:
        # Skip comment lines
        if line.strip().startswith('--'):
            fixed_lines.append(line)
            continue
        
        # Fix common issues with apostrophes in names
        # Replace patterns like "s/o" that might break quotes
        line = line.replace("'s/o", "' || 's/o' || '")
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def seed_data():
    if not os.path.exists(SQL_FILE_PATH):
        print(f"❌ File not found: {SQL_FILE_PATH}")
        return False

    print(f"✓ Found SQL file: {SQL_FILE_PATH}")
    print("📖 Reading and fixing SQL file...")
    
    with open(SQL_FILE_PATH, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"✓ File size: {len(sql_content)} characters")
    
    # Try to fix SQL issues
    # sql_content = fix_sql_quotes(sql_content)

    with app.app_context():
        print("\n🔧 Dropping all existing tables...")
        try:
            # Drop with CASCADE to handle foreign keys
            db.session.execute(text("DROP SCHEMA public CASCADE"))
            db.session.execute(text("CREATE SCHEMA public"))
            db.session.execute(text("GRANT ALL ON SCHEMA public TO lyrcon_user"))
            db.session.execute(text("GRANT ALL ON SCHEMA public TO public"))
            db.session.commit()
            print("✓ Schema reset")
        except Exception as e:
            print(f"⚠ Warning dropping tables: {e}")
            db.session.rollback()
        
        print("\n📦 Executing SQL file...")
        try:
            # Split by statement but be smarter about it
            # Remove comments first
            lines = sql_content.split('\n')
            clean_lines = []
            for line in lines:
                # Keep everything except standalone comment lines
                if not line.strip().startswith('--') or 'INSERT' in line or 'CREATE' in line:
                    clean_lines.append(line)
            
            clean_sql = '\n'.join(clean_lines)
            
            # Now split by semicolon
            statements = []
            current_stmt = []
            in_string = False
            
            for char in clean_sql:
                current_stmt.append(char)
                
                if char == "'":
                    in_string = not in_string
                elif char == ';' and not in_string:
                    stmt = ''.join(current_stmt).strip()
                    if stmt and not stmt.startswith('--'):
                        statements.append(stmt)
                    current_stmt = []
            
            total = len(statements)
            print(f"Found {total} SQL statements")
            
            success_count = 0
            error_count = 0
            failed_statements = []
            
            for i, stmt in enumerate(statements, 1):
                if not stmt or len(stmt) < 5:
                    continue
                
                # Skip pure comment statements
                if stmt.strip().startswith('--'):
                    continue
                    
                try:
                    db.session.execute(text(stmt))
                    success_count += 1
                    
                    # Commit every 50 statements
                    if i % 50 == 0:
                        db.session.commit()
                        print(f"Progress: {i}/{total} statements ({success_count} successful, {error_count} errors)")
                        
                except Exception as e:
                    db.session.rollback()  # Rollback failed transaction
                    error_count += 1
                    error_msg = str(e)
                    
                    # Skip acceptable errors
                    if any(x in error_msg.lower() for x in ['already exists', 'duplicate', 'empty query']):
                        continue
                    
                    # Log actual errors
                    if 'unterminated' in error_msg.lower() or 'syntax error' in error_msg.lower():
                        failed_statements.append((i, stmt[:200], error_msg[:100]))
                        if len(failed_statements) <= 5:  # Only show first 5
                            print(f"⚠ Statement {i} FAILED: {stmt[:80]}...")
                            print(f"   Error: {error_msg[:150]}")
                    
                    continue
            
            # Final commit
            try:
                db.session.commit()
            except:
                db.session.rollback()
            
            print(f"\n✅ Import completed!")
            print(f"   Total statements: {total}")
            print(f"   Successful: {success_count}")
            print(f"   Errors: {error_count}")
            
            # Verify data
            print("\n🔍 Verifying imported data:")
            tables = db.session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;")).fetchall()
            print(f"   📊 Tables created: {len(tables)}")
            
            total_rows = 0
            for table in tables:
                table_name = table[0]
                try:
                    count = db.session.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()
                    total_rows += count
                    if count > 0:
                        print(f"   ✓ {table_name}: {count} rows")
                except:
                    print(f"   ✗ {table_name}: Error reading")
            
            print(f"\n   📈 Total rows imported: {total_rows}")
            
            if failed_statements:
                print(f"\n⚠ {len(failed_statements)} statements had syntax errors")
                print("  These likely contain data with quote issues that need manual fixing")
            
            return len(tables) > 20  # Success if we have most tables
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Critical Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    print("="*60)
    print("🌱 LyrconCar Database Seeding Script v2")
    print("="*60)
    success = seed_data()
    if success:
        print("\n✅ Database seeding completed successfully!")
    else:
        print("\n❌ Database seeding had issues - check errors above")
    print("="*60)