from app import app, db, User

def seed_admin():
    with app.app_context():
        admin_email = "admin@lyrcon.com"
        existing = db.session.execute(db.select(User).filter_by(email=admin_email)).scalar_one_or_none()
        
        if not existing:
            print(f"Seeding admin user: {admin_email}")
            admin = User(
                name="System Admin",
                email=admin_email,
                password="password123", # Plain text for demo as per app.py
                role="Manager",
                phone="1234567890",
                location="HQ"
            )
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin user created successfully")
        else:
            print("ℹ Admin user already exists")

if __name__ == "__main__":
    seed_admin()
