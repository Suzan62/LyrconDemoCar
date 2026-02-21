
from app import app, db, Vehicle, OldCar, OldCarSell

def find_vehicle():
    with app.app_context():
        print("Searching for 'Test Seller2' in New Cars...")
        v = Vehicle.query.filter(Vehicle.buyer_name == 'Test Seller2').first()
        if v:
            print(f"Found in Vehicle (New Cars): ID={v.id}, Type={v.transaction_type}, Status={v.status}")
            print(v.to_dict())
            return

        print("Searching in Old Car Sell...")
        v = OldCarSell.query.filter(OldCarSell.customer_name == 'Test Seller2').first()
        if v:
            print(f"Found in OldCarSell: ID={v.id}")
            # print(v.to_dict()) # OldCarSell might not have to_dict, check app.py
            return

        print("Searching in Old Car Purchase...")
        v = OldCar.query.filter(OldCar.customer_name == 'Test Seller2').first()
        if v:
            print(f"Found in OldCar: ID={v.id}")
            print(v.to_dict())
            return

        print("Not found.")

if __name__ == "__main__":
    find_vehicle()
