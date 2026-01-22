import os
import bcrypt
from app import app, db, User

def seed_production():
    with app.app_context():
        print("🔄 Initializing Production Database...")
        
        # 1. Create Tables
        db.create_all()
        print("✅ Database tables created (if not existed).")
        
        # 2. Check for Admin User
        admin_email = "admin@lyrcon.com"
        admin = db.session.execute(db.select(User).filter_by(email=admin_email)).scalar_one_or_none()
        
        if admin:
            print(f"ℹ️ Admin user ({admin_email}) already exists. Skipping.")
        else:
            print(f"👤 creating default admin user: {admin_email}")
            
            # Hash password (same logic as in login endpoint)
            password = "password123"
            hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            hashed_password = hashed_bytes.decode('utf-8')
            
            new_admin = User(
                name="Admin User",
                email=admin_email,
                password=hashed_password,
                role="admin"
            )
            
            db.session.add(new_admin)
            db.session.commit()
            print(f"✅ Admin created with password: {password}")
            
if __name__ == "__main__":
    seed_production()
