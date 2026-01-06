from app import app, db, User

with app.app_context():
    try:
        # Drop all existing tables
        db.drop_all()
        print("Dropped all tables.")
        
        # Create new tables
        db.create_all()
        print("Created all tables.")
        
        # Seed Admin User
        admin = User(
            name="Admin User",
            email="admin@lyrcon.com",
            password="password",
            role="Admin",
            phone="123-456-7890",
            location="New York, USA"
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully.")
        
    except Exception as e:
        print(f"Error recreating database: {e}")
