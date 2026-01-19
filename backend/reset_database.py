"""
Database Reset Script for Lyrcon Replica
This script drops all existing tables and recreates them with the Flask models
"""
from app import app, db, User
import sys

def reset_database():
    """Drop all tables and recreate them"""
    try:
        with app.app_context():
            print("=" * 60)
            print("DATABASE RESET SCRIPT")
            print("=" * 60)
            
            # Drop all tables
            print("\n[1/3] Dropping all existing tables...")
            db.drop_all()
            print("[OK] All tables dropped successfully")
            
            # Create all tables
            print("\n[2/3] Creating tables from Flask models...")
            db.create_all()
            print("[OK] All tables created successfully")
            
            # Create admin user
            print("\n[3/3] Creating admin user...")
            admin_email = "admin@lyrcon.com"
            admin_password = "password123"
            
            # Check if admin already exists
            existing_admin = db.session.execute(
                db.select(User).filter_by(email=admin_email)
            ).scalar_one_or_none()
            
            if existing_admin:
                print(f"[INFO] Admin user already exists: {admin_email}")
            else:
                admin_user = User(
                    name="Admin User",
                    email=admin_email,
                    password=admin_password,
                    role="Manager",
                    phone="9876543210",
                    location="Headquarters"
                )
                db.session.add(admin_user)
                db.session.commit()
                print(f"[OK] Admin user created successfully")
                print(f"  Email: {admin_email}")
                print(f"  Password: {admin_password}")
            
            print("\n" + "=" * 60)
            print("[SUCCESS] DATABASE RESET COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            print("\nYou can now start the backend with: python app.py")
            print(f"Login with: {admin_email} / {admin_password}")
            
            return True
            
    except Exception as e:
        print("\n" + "=" * 60)
        print("[ERROR] DATABASE RESET FAILED")
        print("=" * 60)
        print(f"\nError details: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running")
        print("2. Verify database credentials in app.py")
        print("3. Check that database 'lyrcon' exists")
        print("\nCurrent connection string:")
        print(f"  {app.config['SQLALCHEMY_DATABASE_URI']}")
        return False

if __name__ == "__main__":
    success = reset_database()
    sys.exit(0 if success else 1)
