from app import app, db, User

with app.app_context():
    try:
        user_email = "dummy@lyrcon.com"
        existing_user = db.session.execute(db.select(User).filter_by(email=user_email)).scalar_one_or_none()
        
        if existing_user:
            print(f"User {user_email} already exists.")
        else:
            dummy = User(
                name="Dummy User",
                email=user_email,
                password="password",
                role="Generable",
                phone="999-999-9999",
                location="Test Lab"
            )
            db.session.add(dummy)
            db.session.commit()
            print(f"User {user_email} created successfully.")
    except Exception as e:
        print(f"Error creating user: {e}")
