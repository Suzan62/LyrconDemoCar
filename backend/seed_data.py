from app import app, db, Vehicle, User
from datetime import datetime

# Full Reset Mode
with app.app_context():
    print("Dropping all tables to fix schema...")
    db.drop_all()
    print("Creating new tables...")
    db.create_all()

    # Seed Admin User
    admin = User(
        name="Admin User",
        email="admin@example.com",
        password="password", # In real app use hash, but this is a replica/demo
        role="Admin"
    )
    db.session.add(admin)
    print("Added Admin User (admin@example.com / password)")

    vehicles_data = [
        { "make": "Tesla", "model": "Model 3", "year": 2023, "price": 32900, "mileage": 12000, "status": "Available", "transaction_type": "New", "vin": "INV-001" },
        { "make": "Ford", "model": "Mustang", "year": 2021, "price": 28500, "mileage": 25000, "status": "Pending", "transaction_type": "Purchase", "vin": "INV-002" },
        { "make": "BMW", "model": "3 Series", "year": 2022, "price": 41200, "mileage": 18000, "status": "Available", "transaction_type": "New", "vin": "INV-003" },
        { "make": "Honda", "model": "Civic", "year": 2024, "price": 24100, "mileage": 5000, "status": "Negotiation", "transaction_type": "Sale", "vin": "INV-004" },
        { "make": "Audi", "model": "Q5", "year": 2020, "price": 35800, "mileage": 32000, "status": "Available", "transaction_type": "Purchase", "vin": "INV-005" },
        { "make": "Toyota", "model": "Camry", "year": 2022, "price": 22000, "mileage": 40000, "status": "Sold", "transaction_type": "Sale", "vin": "INV-006", "delivery_date": datetime.now() }
    ]

    print("Seeding vehicles...")
    for v_data in vehicles_data:
        v = Vehicle(
            manufacturer=v_data['make'],
            model=v_data['model'],
            year=v_data['year'],
            price=v_data['price'],
            running_km=v_data['mileage'],
            status=v_data['status'],
            transaction_type=v_data['transaction_type'],
            chassis_number=v_data['vin'],
            docket_number=f"DOC-{v_data['vin']}",
            delivery_date=v_data.get('delivery_date')
        )
        db.session.add(v)
        print(f"Added {v_data['make']} {v_data['model']}")
    
    db.session.commit()
    print("Data seeded successfully!")
