
from app import app, db, OldCarDocument
from sqlalchemy import inspect

def update_schema():
    with app.app_context():
        inspector = inspect(db.engine)
        if 'old_car_documents' not in inspector.get_table_names():
            print("Creating old_car_documents table...")
            OldCarDocument.__table__.create(db.engine)
            print("Table created.")
        if 'old_car_sell_documents' not in inspector.get_table_names():
            print("Creating old_car_sell_documents table...")
            from app import OldCarSellDocument
            OldCarSellDocument.__table__.create(db.engine)
            print("Table old_car_sell_documents created.")

if __name__ == "__main__":
    update_schema()
