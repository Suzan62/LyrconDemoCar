from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, Boolean, Date, DateTime, Text, ForeignKey
from datetime import datetime, date
import os
import requests
from werkzeug.utils import secure_filename
import json
import bcrypt
class Base(DeclarativeBase):
  pass

db = SQLAlchemy(model_class=Base)

app = Flask(__name__)
# Database Configuration
# Use DATABASE_URL env var if available (Production), else fallback to local (Dev)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/LyrconCar")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
from flask import send_from_directory

CORS(app)

db.init_app(app)

from ml_service import MLService
ml_service = MLService()

@app.route('/api/ml/forecast', methods=['GET'])
def get_sales_forecast():
    try:
        updated_model = ml_service.train_model() # Ensure model is fresh or loaded
        if updated_model.get('status') == 'error':
            return jsonify({"status": "error", "message": updated_model.get('message')}), 400
            
        forecast_data = ml_service.forecast(months=6)
        if not forecast_data:
             return jsonify({"status": "error", "message": "Forecasting failed"}), 500
             
        return jsonify(forecast_data)
    except Exception as e:
        import traceback
        error_msg = f"ML Error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        with open('debug_log.txt', 'a') as f:
            f.write(f"\n--- ML ERROR {datetime.now()} ---\n")
            f.write(error_msg + "\n")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/uploads/<name>')
def download_file(name):
    return send_from_directory(app.config["UPLOAD_FOLDER"], name)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
        # Return URL relative to server root
        return jsonify({'url': f"/uploads/{unique_filename}", 'filename': unique_filename}), 200


# ----------------- MODELS -----------------

class User(db.Model):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    # Map 'name' in python to 'full_name' in DB
    name: Mapped[str] = mapped_column("full_name", String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    last_login: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default='active')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_login": self.last_login,
            "status": self.status
        }

class Vehicle(db.Model):
    __tablename__ = 'new_cars'  # Legacy table name
    
    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Core Fields
    docket_number: Mapped[str] = mapped_column(String(255), nullable=True)
    # transaction_type mapped to 'entry_type' (sales/purchase implicit?)
    # DB has check constraint (entry_type IN ('sales')), defaults to 'sales'
    transaction_type: Mapped[str] = mapped_column("entry_type", String(50), default="sales") 
    
    manufacturer: Mapped[str] = mapped_column("manufacturer_name", String(255), nullable=True)
    model: Mapped[str] = mapped_column("model_name", String(255), nullable=True)
    color: Mapped[str] = mapped_column(String(50), nullable=True)
    year: Mapped[str] = mapped_column("manufacture_year", String(255), nullable=True) # DB is varchar
    fuel_type: Mapped[str] = mapped_column(String(255), nullable=True)
    
    running_km: Mapped[int] = mapped_column("running_kilometer", Integer, nullable=True)
    registration_number: Mapped[str] = mapped_column("registration_no", String(255), nullable=True)
    chassis_number: Mapped[str] = mapped_column("chassis_no", String(255), nullable=True)
    engine_number: Mapped[str] = mapped_column("engine_no", String(255), nullable=True)
    
    # Location/Executive
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    executive_name: Mapped[str] = mapped_column(String(255), nullable=True)
    dealer: Mapped[str] = mapped_column("dealer_name", String(255), nullable=True)
    
    # RTO
    rto_name: Mapped[str] = mapped_column(String(255), nullable=True)
    rto_code: Mapped[str] = mapped_column(String(255), nullable=True)
    # rto_passing_status -> parsing_status in DB
    rto_passing_status: Mapped[str] = mapped_column("parsing_status", String(50), nullable=True)
    plate_type: Mapped[str] = mapped_column("number_plate", String(50), nullable=True)
    choice_number: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Financials
    price: Mapped[int] = mapped_column("ex_showroom_price", Integer, nullable=True)
    # Legacy DB uses separate tax columns, app might just use price. 
    # We map what we can.
    
    # Customer
    buyer_name: Mapped[str] = mapped_column("customer_name", String(255), nullable=True)
    buyer_email: Mapped[str] = mapped_column("email", String(255), nullable=True) 
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    
    # Address breakdown
    city: Mapped[str] = mapped_column("city_name", String(255), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=True)
    address_line_1: Mapped[str] = mapped_column("customer_address1", Text, nullable=True)
    address_line_2: Mapped[str] = mapped_column("customer_address2", Text, nullable=True)
    
    # Dates
    booking_date: Mapped[date] = mapped_column(Date, nullable=True)
    delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    customer_dob: Mapped[date] = mapped_column(Date, nullable=True)
    nominee_dob: Mapped[date] = mapped_column(Date, nullable=True)
    
    # Nominee
    nominee_name: Mapped[str] = mapped_column(String(255), nullable=True)
    nominee_relation: Mapped[str] = mapped_column("nominee_relationship", String(50), nullable=True)
    
    # Broker
    broker_name: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Misc
    other_remarks: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default='unsold') # sold/unsold in check constraint
    
    hp_name: Mapped[str] = mapped_column(String(255), nullable=True)
    scheme: Mapped[str] = mapped_column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "transaction_type": "New" if self.transaction_type == 'sales' else self.transaction_type,
            "entry_type": self.transaction_type,  # Alias
            "docket_number": self.docket_number,
            "manufacturer": self.manufacturer,
            "manufacturer_name": self.manufacturer,  # Alias
            "model": self.model,
            "model_name": self.model,  # Alias
            "year": self.year,
            "manufacture_year": self.year,  # Alias
            "color": self.color,
            "fuel_type": self.fuel_type,
            "chassis_number": self.chassis_number,
            "chassis_no": self.chassis_number,  # Alias
            "vin": self.chassis_number, # Alias
            "engine_number": self.engine_number,
            "engine_no": self.engine_number,  # Alias
            "registration_number": self.registration_number,
            "registration_no": self.registration_number,  # Alias
            "running_km": self.running_km,
            "running_kilometer": self.running_km,  # Alias
            "rto_name": self.rto_name,
            "rto_code": self.rto_code,
            "rto_passing_status": self.rto_passing_status,
            "parsing_status": self.rto_passing_status,  # Alias
            "plate_type": self.plate_type,
            "number_plate": self.plate_type,  # Alias
            "choice_number": self.choice_number,
            "price": self.price,
            "ex_showroom_price": self.price,  # Alias
            "status": self.status,
            "buyer_name": self.buyer_name,
            "customer_name": self.buyer_name,  # Alias
            "buyer_email": self.buyer_email,
            "email": self.buyer_email,  # Alias
            "customer_phone": self.customer_phone,
            "city": self.city,
            "city_name": self.city,  # Alias
            "pincode": self.pincode,
            "address_line_1": self.address_line_1,
            "customer_address1": self.address_line_1,  # Alias
            "address_line_2": self.address_line_2,
            "customer_address2": self.address_line_2,  # Alias
            "booking_date": str(self.booking_date) if self.booking_date else None,
            "delivery_date": str(self.delivery_date) if self.delivery_date else None,
            "customer_dob": str(self.customer_dob) if self.customer_dob else None,
            "nominee_name": self.nominee_name,
            "nominee_relation": self.nominee_relation,
            "nominee_relationship": self.nominee_relation,  # Alias
            "nominee_dob": str(self.nominee_dob) if self.nominee_dob else None,
            "broker_name": self.broker_name,
            "other_remarks": self.other_remarks,
            "hp_name": self.hp_name,
            "scheme": self.scheme,
            "location": self.location,
            "executive_name": self.executive_name,
            "dealer": self.dealer,
            "dealer_name": self.dealer  # Alias
        }

class OldCar(db.Model):
    __tablename__ = 'old_cars'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    docket_number: Mapped[str] = mapped_column(String(20), nullable=True)
    
    # Pricing
    original_price: Mapped[int] = mapped_column(Integer, nullable=True)
    current_price: Mapped[int] = mapped_column(Integer, nullable=True)
    renovation_cost: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    
    # Customer
    customer_name: Mapped[str] = mapped_column(String(100), nullable=True)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    customer_address1: Mapped[str] = mapped_column(String(255), nullable=True)
    customer_address2: Mapped[str] = mapped_column(String(255), nullable=True)
    pincode: Mapped[str] = mapped_column(String(10), nullable=True)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    customer_dob: Mapped[date] = mapped_column(Date, nullable=True)
    city_name: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Vehicle Details
    manufacturer_name: Mapped[str] = mapped_column(String(255), nullable=True)
    model_name: Mapped[str] = mapped_column(String(255), nullable=True)
    manufacture_year: Mapped[str] = mapped_column(String(255), nullable=True)
    fuel_type: Mapped[str] = mapped_column(String(255), nullable=True)
    color: Mapped[str] = mapped_column(String(50), nullable=True)
    registration_no: Mapped[str] = mapped_column(String(20), nullable=True)
    chassis_no: Mapped[str] = mapped_column(String(50), nullable=True)
    engine_no: Mapped[str] = mapped_column(String(50), nullable=True)
    running_kilometer: Mapped[int] = mapped_column(Integer, nullable=True)
    no_of_owners: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # Insurance
    insurance_expiry_date: Mapped[date] = mapped_column(Date, nullable=True)
    insurance_company_name: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Location/Executive
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    dealer_name: Mapped[str] = mapped_column(String(255), nullable=True)
    executive_branch_name: Mapped[str] = mapped_column(String(255), nullable=True)
    executive_name: Mapped[str] = mapped_column(String(255), nullable=True)
    executive_number: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # RTO
    rto_name: Mapped[str] = mapped_column(String(255), nullable=True)
    parsing_status: Mapped[str] = mapped_column(String(50), nullable=False)
    number_plate: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Broker
    scheme: Mapped[str] = mapped_column(String(100), nullable=True)
    broker_name: Mapped[str] = mapped_column(String(100), nullable=True)
    broker_brokerage: Mapped[int] = mapped_column(Integer, nullable=True)
    broker_number: Mapped[int] = mapped_column(Integer, nullable=True)
    other_remarks: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default='unsold', nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self):
        return {
            "id": self.id,
            "transaction_type": "Purchase",
            "docket_number": self.docket_number,
            "original_price": self.original_price,
            "current_price": self.current_price,
            "price": self.current_price,
            "customer_name": self.customer_name,
            "buyer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "customer_address1": self.customer_address1,
            "address_line_1": self.customer_address1,
            "customer_address2": self.customer_address2,
            "address_line_2": self.customer_address2,
            "pincode": self.pincode,
            "email": self.email,
            "buyer_email": self.email,
            "customer_dob": str(self.customer_dob) if self.customer_dob else None,
            "city_name": self.city_name,
            "city": self.city_name,
            "manufacturer_name": self.manufacturer_name,
            "manufacturer": self.manufacturer_name,
            "model_name": self.model_name,
            "model": self.model_name,
            "manufacture_year": self.manufacture_year,
            "year": self.manufacture_year,
            "fuel_type": self.fuel_type,
            "color": self.color,
            "registration_no": self.registration_no,
            "registration_number": self.registration_no,
            "chassis_no": self.chassis_no,
            "chassis_number": self.chassis_no,
            "vin": self.chassis_no,
            "engine_no": self.engine_no,
            "engine_number": self.engine_no,
            "running_kilometer": self.running_kilometer,
            "running_km": self.running_kilometer,
            "no_of_owners": self.no_of_owners,
            "insurance_expiry_date": str(self.insurance_expiry_date) if self.insurance_expiry_date else None,
            "insurance_company_name": self.insurance_company_name,
            "location": self.location,
            "dealer_name": self.dealer_name,
            "dealer": self.dealer_name,
            "executive_branch_name": self.executive_branch_name,
            "executive_name": self.executive_name,
            "executive_number": self.executive_number,
            "rto_name": self.rto_name,
            "parsing_status": self.parsing_status,
            "rto_passing_status": self.parsing_status,
            "number_plate": self.number_plate,
            "plate_type": self.number_plate,
            "scheme": self.scheme,
            "broker_name": self.broker_name,
            "broker_brokerage": self.broker_brokerage,
            "broker_number": self.broker_number,
            "other_remarks": self.other_remarks,
            "status": self.status,
            "renovation_cost": self.renovation_cost
        }

class OldCarSell(db.Model):
    __tablename__ = 'old_cars_sell'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    docket_number: Mapped[str] = mapped_column(String(20), nullable=True)
    
    # Pricing
    original_price: Mapped[int] = mapped_column(Integer, nullable=True)
    current_price: Mapped[int] = mapped_column(Integer, nullable=True)
    renovation_cost: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    
    # Customer
    customer_name: Mapped[str] = mapped_column(String(100), nullable=True)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    customer_address1: Mapped[str] = mapped_column(String(255), nullable=True)
    customer_address2: Mapped[str] = mapped_column(String(255), nullable=True)
    pincode: Mapped[str] = mapped_column(String(10), nullable=True)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    customer_dob: Mapped[date] = mapped_column(Date, nullable=True)
    city_name: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Vehicle Details
    manufacturer_name: Mapped[str] = mapped_column(String(255), nullable=True)
    model_name: Mapped[str] = mapped_column(String(255), nullable=True)
    manufacture_year: Mapped[str] = mapped_column(String(255), nullable=True)
    fuel_type: Mapped[str] = mapped_column(String(255), nullable=True)
    color: Mapped[str] = mapped_column(String(50), nullable=True)
    registration_no: Mapped[str] = mapped_column(String(20), nullable=True)
    chassis_no: Mapped[str] = mapped_column(String(50), nullable=True)
    engine_no: Mapped[str] = mapped_column(String(50), nullable=True)
    running_kilometer: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # Insurance
    insurance_expiry_date: Mapped[date] = mapped_column(Date, nullable=True)
    insurance_company_name: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Location/Executive
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    dealer_name: Mapped[str] = mapped_column(String(255), nullable=True)
    executive_branch_name: Mapped[str] = mapped_column(String(255), nullable=True)
    executive_name: Mapped[str] = mapped_column(String(255), nullable=True)
    executive_number: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # RTO
    rto_name: Mapped[str] = mapped_column(String(255), nullable=True)
    rto_code: Mapped[str] = mapped_column(String(255), nullable=True)
    hp_name: Mapped[str] = mapped_column(String(255), nullable=True)
    parsing_status: Mapped[str] = mapped_column(String(50), nullable=False)
    number_plate: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Broker
    scheme: Mapped[str] = mapped_column(String(100), nullable=True)
    broker_name: Mapped[str] = mapped_column(String(100), nullable=True)
    broker_number: Mapped[int] = mapped_column(Integer, nullable=True)
    other_remarks: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default='unsold', nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self):
        return {
            "id": self.id,
            "transaction_type": "Sale",
            "docket_number": self.docket_number,
            "original_price": self.original_price,
            "current_price": self.current_price,
            "price": self.current_price,
            "customer_name": self.customer_name,
            "buyer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "customer_address1": self.customer_address1,
            "address_line_1": self.customer_address1,
            "customer_address2": self.customer_address2,
            "address_line_2": self.customer_address2,
            "pincode": self.pincode,
            "email": self.email,
            "buyer_email": self.email,
            "customer_dob": str(self.customer_dob) if self.customer_dob else None,
            "city_name": self.city_name,
            "city": self.city_name,
            "manufacturer_name": self.manufacturer_name,
            "manufacturer": self.manufacturer_name,
            "model_name": self.model_name,
            "model": self.model_name,
            "manufacture_year": self.manufacture_year,
            "year": self.manufacture_year,
            "fuel_type": self.fuel_type,
            "color": self.color,
            "registration_no": self.registration_no,
            "registration_number": self.registration_no,
            "chassis_no": self.chassis_no,
            "chassis_number": self.chassis_no,
            "vin": self.chassis_no,
            "engine_no": self.engine_no,
            "engine_number": self.engine_no,
            "running_kilometer": self.running_kilometer,
            "running_km": self.running_kilometer,
            "insurance_expiry_date": str(self.insurance_expiry_date) if self.insurance_expiry_date else None,
            "insurance_company_name": self.insurance_company_name,
            "location": self.location,
            "dealer_name": self.dealer_name,
            "dealer": self.dealer_name,
            "executive_branch_name": self.executive_branch_name,
            "executive_name": self.executive_name,
            "executive_number": self.executive_number,
            "rto_name": self.rto_name,
            "rto_code": self.rto_code,
            "hp_name": self.hp_name,
            "parsing_status": self.parsing_status,
            "rto_passing_status": self.parsing_status,
            "number_plate": self.number_plate,
            "plate_type": self.number_plate,
            "scheme": self.scheme,
            "broker_name": self.broker_name,
            "broker_number": self.broker_number,
            "other_remarks": self.other_remarks,
            "status": self.status,
            "renovation_cost": self.renovation_cost
        }

class VehicleDocument(db.Model):
    __tablename__ = 'car_documents' # Matches SQL dump
    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column("car_id", Integer, ForeignKey('new_cars.id'), nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # file_path is 'document_path' in DB
    file_path: Mapped[str] = mapped_column("document_path", String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class OldCarDocument(db.Model):
    __tablename__ = 'old_car_documents'
    id: Mapped[int] = mapped_column(primary_key=True)
    old_car_id: Mapped[int] = mapped_column(Integer, ForeignKey('old_cars.id'), nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class OldCarSellDocument(db.Model):
    __tablename__ = 'old_car_sell_documents'
    id: Mapped[int] = mapped_column(primary_key=True)
    sell_id: Mapped[int] = mapped_column(Integer, ForeignKey('old_cars_sell.id'), nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class FinanceRecord(db.Model):
    __tablename__ = 'finances'
    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column("car_id", Integer, ForeignKey('new_cars.id'), nullable=True)
    
    bank_name: Mapped[str] = mapped_column(String(255), nullable=True)
    bank_branch: Mapped[str] = mapped_column(String(255), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=True)
    account_number: Mapped[str] = mapped_column(String(255), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    contact_number: Mapped[str] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    
    starting_date: Mapped[date] = mapped_column(Date, nullable=True)
    ending_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    amount: Mapped[float] = mapped_column(Float, nullable=True)
    loan_protection: Mapped[str] = mapped_column(String(255), nullable=True) # varchar in DB
    disbursement_amount: Mapped[float] = mapped_column(Float, nullable=True)
    disbursement_date: Mapped[date] = mapped_column("DATE", Date, nullable=True) # 'DATE' column name
    payment_out: Mapped[float] = mapped_column(Float, default=0.0)
    
    status: Mapped[str] = mapped_column(String(50), nullable=True) # Received/Not Received
    emi_amount: Mapped[float] = mapped_column(Float, nullable=True)
    executive: Mapped[str] = mapped_column(String(255), nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "car_id": self.vehicle_id,  # Alias for compatibility
            "bank_name": self.bank_name,
            "bank_branch": self.bank_branch,
            "customer_name": self.customer_name,
            "account_number": self.account_number,
            "address": self.address,
            "contact_number": self.contact_number,
            "email": self.email,
            "starting_date": str(self.starting_date) if self.starting_date else None,
            "ending_date": str(self.ending_date) if self.ending_date else None,
            "amount": self.amount,
            "loan_protection": self.loan_protection,
            "disbursement_amount": self.disbursement_amount,
            "disbursement_date": str(self.disbursement_date) if self.disbursement_date else None,
            "DATE": str(self.disbursement_date) if self.disbursement_date else None,  # Alias
            "payment_out": self.payment_out,
            "status": self.status,
            "emi_amount": self.emi_amount,
            "executive": self.executive
        }

class Insurance(db.Model):
    __tablename__ = 'insurances' 
    id = db.Column(db.Integer, primary_key=True)
    # car_id exists in insurances table
    vehicle_id = db.Column("car_id", db.Integer, db.ForeignKey('new_cars.id'), nullable=True)
    
    bank_name = db.Column("insurance_bank", db.String(100))
    branch = db.Column(db.String(100))
    customer_name = db.Column(db.String(100))
    address = db.Column(db.String(200))
    total_amount = db.Column("amount", db.Float, default=0.0)
    premium_amount = db.Column(db.Float, default=0.0)
    insurance_company = db.Column("insurance_company_name", db.String(100))
    expiry_date = db.Column(db.String(20))
    old_policy_url = db.Column(db.String(255), nullable=True)
    new_policy_url = db.Column(db.String(255), nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "bank_name": self.bank_name,
            "customer_name": self.customer_name,
            "amount": self.total_amount,
            "expiry_date": self.expiry_date,
            "old_policy_url": self.old_policy_url,
            "new_policy_url": self.new_policy_url
        }

class Inquiry(db.Model):
    __tablename__ = 'inquiries'
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(255))
    customer_email = db.Column(db.String(255))
    customer_phone = db.Column(db.String(16))
    vehicle_of_interest = db.Column(db.String(255))
    preferred_contact_method = db.Column(db.String(50), default='email')
    additional_notes = db.Column(db.Text)
    inquiry_source = db.Column(db.String(50), default='walk-in')
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "customer": self.customer_name,
            "email": self.customer_email,
            "customerPhone": self.customer_phone,
            "vehicle": self.vehicle_of_interest,
            "contactMethod": self.preferred_contact_method,
            "notes": self.additional_notes,
            "source": self.inquiry_source,
            "status": self.status,
            "date": self.created_at.strftime('%d %b %Y') if self.created_at else "N/A"
        }

# ----------------- NEW MODELS ADDED -----------------

class CarDealer(db.Model):
    __tablename__ = 'car_dealers'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class City(db.Model):
    __tablename__ = 'cities'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class Executive(db.Model):
    __tablename__ = 'executives'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # branch_name inferred from usage or manual fix needed if col differs
    # SQL only shows 'name'. Branch might be separate relation or implied.
    # We will stick to SQL schema which only has 'name'.

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class ExecutiveBranch(db.Model):
    __tablename__ = 'executive_branches'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class Manufacturer(db.Model):
    __tablename__ = 'manufacturers'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class CarModel(db.Model):
    __tablename__ = 'models'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class RTO(db.Model):
    __tablename__ = 'rto'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class RTOCode(db.Model):
    __tablename__ = 'rto_codes'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class InsuranceCompany(db.Model):
    __tablename__ = 'insurance_companies'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

class InsuranceDocument(db.Model):
    __tablename__ = 'insurancedocument'
    id: Mapped[int] = mapped_column(primary_key=True)
    car_id: Mapped[int] = mapped_column(Integer, nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_path: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "car_id": self.car_id,
            "document_name": self.document_name,
            "document_path": self.document_path,
            "created_at": str(self.created_at)
        }

class InsurancePayment(db.Model):
    __tablename__ = 'insurance_payment'
    id: Mapped[int] = mapped_column(primary_key=True)
    insurance_id: Mapped[int] = mapped_column(Integer, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=True)
    payment_date: Mapped[date] = mapped_column(Date, nullable=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "insurance_id": self.insurance_id,
            "amount": self.amount,
            "payment_date": str(self.payment_date) if self.payment_date else None,
            "payment_method": self.payment_method
        }

class FullPaymentDetail(db.Model):
    __tablename__ = 'full_payment_details'
    id: Mapped[int] = mapped_column(primary_key=True)
    sale_id: Mapped[int] = mapped_column(Integer, nullable=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=True)
    amount_paid: Mapped[float] = mapped_column(Float, default=0.0)
    remaining_amount: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "sale_id": self.sale_id,
            "total_amount": self.total_amount,
            "amount_paid": self.amount_paid,
            "remaining_amount": self.remaining_amount
        }

class Installment(db.Model):
    __tablename__ = 'installments'
    id: Mapped[int] = mapped_column(primary_key=True)
    loan_id: Mapped[int] = mapped_column(Integer, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=True)
    due_date: Mapped[date] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default='pending')

    def to_dict(self):
        return {
            "id": self.id,
            "loan_id": self.loan_id,
            "amount": self.amount,
            "due_date": str(self.due_date) if self.due_date else None,
            "status": self.status
        }

class PaymentInstallment(db.Model):
    __tablename__ = 'payment_installments'
    id: Mapped[int] = mapped_column(primary_key=True)
    full_payment_id: Mapped[int] = mapped_column(Integer, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=True)
    payment_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(50), default='completed')
    note: Mapped[str] = mapped_column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "full_payment_id": self.full_payment_id,
            "amount": self.amount,
            "payment_date": str(self.payment_date) if self.payment_date else None,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "note": self.note
        }

class DealerFullPaymentDetail(db.Model):
    __tablename__ = 'dealer_full_payment_details'
    id: Mapped[int] = mapped_column(primary_key=True)
    sale_id: Mapped[int] = mapped_column(Integer, nullable=True)
    car_id: Mapped[int] = mapped_column(Integer, nullable=True)
    old_car_id: Mapped[int] = mapped_column(Integer, nullable=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=True)
    amount_paid: Mapped[float] = mapped_column(Float, default=0.0)
    remaining_amount: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    def to_dict(self):
        return {
            "id": self.id,
            "sale_id": self.sale_id,
            "car_id": self.car_id,
            "old_car_id": self.old_car_id,
            "total_amount": self.total_amount,
            "amount_paid": self.amount_paid,
            "remaining_amount": self.remaining_amount
        }

class DealerPaymentInstallment(db.Model):
    __tablename__ = 'dealer_payment_installments'
    id: Mapped[int] = mapped_column(primary_key=True)
    dealer_payment_id: Mapped[int] = mapped_column(Integer, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=True)
    payment_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=True)
    note: Mapped[str] = mapped_column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "dealer_payment_id": self.dealer_payment_id,
            "amount": self.amount,
            "payment_date": str(self.payment_date) if self.payment_date else None,
            "payment_method": self.payment_method,
            "note": self.note
        }

class ExtraCharge(db.Model):
    __tablename__ = 'extra_charges'
    id: Mapped[int] = mapped_column(primary_key=True)
    car_id: Mapped[int] = mapped_column(Integer, nullable=True)
    label: Mapped[str] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=True)

    def to_dict(self):
        return {"id": self.id, "car_id": self.car_id, "label": self.label, "amount": self.amount}

class ExtraChargeSell(db.Model):
    __tablename__ = 'extra_charges_Sell'
    id: Mapped[int] = mapped_column(primary_key=True)
    car_id: Mapped[int] = mapped_column(Integer, nullable=True)
    label: Mapped[str] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=True)

    def to_dict(self):
        return {"id": self.id, "car_id": self.car_id, "label": self.label, "amount": self.amount}

class NewCarImage(db.Model):
    __tablename__ = 'new_car_images'
    id: Mapped[int] = mapped_column(primary_key=True)
    new_car_id: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "new_car_id": self.new_car_id, "image_url": self.image_url}

class OldCarImage(db.Model):
    __tablename__ = 'old_car_images'
    id: Mapped[int] = mapped_column(primary_key=True)
    old_car_id: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    old_cars_sell_id: Mapped[int] = mapped_column(Integer, nullable=True)

    def to_dict(self):
        return {"id": self.id, "old_car_id": self.old_car_id, "image_url": self.image_url, "old_cars_sell_id": self.old_cars_sell_id}

class OldCarBuyer(db.Model):
    __tablename__ = 'old_car_buyers'
    id: Mapped[int] = mapped_column(primary_key=True)
    sale_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact: Mapped[str] = mapped_column(String(15), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    address_line_1: Mapped[str] = mapped_column(String(255), nullable=False)
    city_name: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    pan_card: Mapped[str] = mapped_column(String(255), nullable=True)
    aadhar_card: Mapped[str] = mapped_column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "sale_id": self.sale_id, "name": self.name, 
            "contact": self.contact, "email": self.email, "city": self.city_name
        }

class Sale(db.Model):
    __tablename__ = 'sales'
    id: Mapped[int] = mapped_column(primary_key=True)
    car_type: Mapped[str] = mapped_column(String(50), nullable=False) # new/old
    car_id: Mapped[int] = mapped_column(Integer, nullable=True)
    sale_type: Mapped[str] = mapped_column(String(50), nullable=False) # full/loan
    total_price: Mapped[float] = mapped_column(Float, nullable=True)
    buyer_name: Mapped[str] = mapped_column(String(255), nullable=True)
    sale_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "car_type": self.car_type, "car_id": self.car_id, 
            "sale_type": self.sale_type, "total_price": self.total_price, "buyer_name": self.buyer_name
        }

class HirePurchase(db.Model):
    __tablename__ = 'hire_purchase'
    id: Mapped[int] = mapped_column(primary_key=True)
    hp_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    def to_dict(self):
        return {"id": self.id, "hp_name": self.hp_name}

class LoanDetail(db.Model):
    __tablename__ = 'loan_details'
    id: Mapped[int] = mapped_column(primary_key=True)
    sale_id: Mapped[int] = mapped_column(Integer, nullable=True)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=True)
    loan_amount: Mapped[float] = mapped_column(Float, nullable=True)
    
    def to_dict(self):
        return {"id": self.id, "sale_id": self.sale_id, "bank_name": self.bank_name, "loan_amount": self.loan_amount}

class RememberToken(db.Model):
    __tablename__ = 'remember_tokens'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=True)
    token: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    def to_dict(self):
        return {"id": self.id, "user_id": self.user_id, "token": self.token}

# ----------------- API ENDPOINTS -----------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()

    # Fix: Use bcrypt to verify password
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({
            "success": True,
            "user": {
                **user.to_dict(),
                "token": f"mock-jwt-token-{user.id}"
            }
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401
# ----------------- USERS ENDPOINTS -----------------

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = db.session.execute(db.select(User).order_by(User.id.desc())).scalars().all()
        return jsonify([u.to_dict() for u in users]), 200
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        
        # Check if email already exists
        existing_user = db.session.execute(
            db.select(User).filter_by(email=data.get('email'))
        ).scalar_one_or_none()
        
        if existing_user:
            return jsonify({
                "success": False,
                "message": "User with this email already exists"
            }), 400
        
        new_user = User(
            name=data.get('name') or data.get('full_name'),
            email=data.get('email'),
            password=data.get('password'),
            role=data.get('role', 'user')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "user": new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route('/api/users/<int:id>', methods=['GET'])
def get_user(id):
    user = db.session.get(User, id)
    if not user: 
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200

@app.route('/api/users/<int:id>', methods=['PUT'])
def update_user(id):
    try:
        user = db.session.get(User, id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        data = request.get_json()
        
        if data.get('name') or data.get('full_name'):
            user.name = data.get('name') or data.get('full_name')
        if data.get('email'):
            user.email = data.get('email')
        if data.get('password'):
            user.password = data.get('password')
        if data.get('role'):
            user.role = data.get('role')
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating user: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route('/api/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    try:
        user = db.session.get(User, id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"success": True, "message": "User deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting user: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ----------------- VEHICLES ENDPOINTS -----------------

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    try:
        # Fetch from all three tables
        new_cars = db.session.execute(db.select(Vehicle).order_by(Vehicle.id.desc())).scalars().all()
        old_cars = db.session.execute(db.select(OldCar).order_by(OldCar.id.desc())).scalars().all()
        old_cars_sell = db.session.execute(db.select(OldCarSell).order_by(OldCarSell.id.desc())).scalars().all()
        
        # Combine all vehicles with proper transaction_type tagging
        all_vehicles = []
        
        for car in new_cars:
            vehicle_dict = car.to_dict()
            vehicle_dict['transaction_type'] = 'New'
            vehicle_dict['_table'] = 'new_cars'
            all_vehicles.append(vehicle_dict)
        
        for car in old_cars:
            vehicle_dict = car.to_dict()
            vehicle_dict['transaction_type'] = 'Purchase'
            vehicle_dict['_table'] = 'old_cars'
            all_vehicles.append(vehicle_dict)
        
        for car in old_cars_sell:
            vehicle_dict = car.to_dict()
            vehicle_dict['transaction_type'] = 'Sale'
            vehicle_dict['_table'] = 'old_cars_sell'
            all_vehicles.append(vehicle_dict)
        
        response = jsonify(all_vehicles)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200
    except Exception as e:
        print(f"Error fetching vehicles: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/count', methods=['GET'])
def get_vehicles_count():
    """Debug endpoint to check total count"""
    try:
        # Count from all tables
        new_count = db.session.query(Vehicle).count()
        old_count = db.session.query(OldCar).count()
        old_sell_count = db.session.query(OldCarSell).count()
        
        total = new_count + old_count + old_sell_count
        
        return jsonify({
            "total": total,
            "new_cars": new_count,
            "old_cars": old_count,
            "old_cars_sell": old_sell_count
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            files = request.files
        else:
            data = request.get_json()
            files = {}

        # Default to 'sales' if not provided
        entry_type = data.get('transaction_type', 'sales').lower()
        if entry_type == 'sale': entry_type = 'sales'

        # Explicitly handle Old Car Sell (transaction_type='Sale')
        if data.get('transaction_type') == 'Sale':
             new_vehicle = OldCarSell(
                docket_number=data.get('docket_number'),
                original_price=int(float(data.get('buying_price', 0))) if data.get('buying_price') else 0,
                current_price=int(float(data.get('price', 0))) if data.get('price') else 0,
                renovation_cost=int(data.get('renovation_cost', 0)) if data.get('renovation_cost') else 0,
                status='sold',
                
                # Customer
                customer_name=data.get('customer_name') or data.get('buyer_name'),
                customer_phone=data.get('customer_phone'),
                customer_address1=data.get('customer_address_line1'),
                customer_address2=data.get('customer_address_line2'),
                city_name=data.get('customer_city'),
                pincode=data.get('customer_pincode'),
                email=data.get('customer_email') or data.get('buyer_email'),
                
                # Vehicle
                manufacturer_name=data.get('manufacturer'),
                model_name=data.get('model'),
                manufacture_year=str(data.get('year')) if data.get('year') else None,
                color=data.get('color'),
                fuel_type=data.get('fuel_type'),
                registration_no=data.get('registration_number'),
                chassis_no=data.get('vin') or data.get('chassis_number'),
                engine_no=data.get('engine_number'),
                running_kilometer=int(data.get('running_km', 0)),
                
                # Others
                insurance_company_name=data.get('insurance_company'),
                executive_branch_name=data.get('executive_branch'),
                executive_name=data.get('executive_name'),
                executive_number=int(data.get('executive_number')) if data.get('executive_number') else None,
                rto_name=data.get('rto_name'),
                rto_code=data.get('rto_code'),
                parsing_status=data.get('rto_passing_status') or 'Pending',
                number_plate=data.get('plate_type') or 'Normal',
                
                scheme=data.get('scheme'),
                broker_name=data.get('broker_name'),
                broker_number=int(data.get('broker_number')) if data.get('broker_number') else None,
                other_remarks=data.get('other_remarks')
             )
             
             def parse_date(d_str):
                if d_str: 
                    try: return datetime.strptime(d_str, '%Y-%m-%d')
                    except: return None
                return None

             if data.get('customer_dob'): new_vehicle.customer_dob = parse_date(data.get('customer_dob'))
             if data.get('insurance_expiry'): new_vehicle.insurance_expiry_date = parse_date(data.get('insurance_expiry'))

        elif entry_type == 'purchase':
            # Create Old Car
            new_vehicle = OldCar(
                docket_number=data.get('docket_number'),
                manufacturer_name=data.get('manufacturer'),
                model_name=data.get('model'),
                manufacture_year=str(data.get('year')) if data.get('year') else None,
                color=data.get('color'),
                fuel_type=data.get('fuel_type'),
                chassis_no=data.get('vin') or data.get('chassis_number'),
                engine_no=data.get('engine_number'),
                registration_no=data.get('registration_number'),
                running_kilometer=int(data.get('running_km', 0)),
                parsing_status=data.get('rto_passing_status') or 'Pending',  # Default strict
                number_plate=data.get('plate_type') or 'Normal',
                executive_name=data.get('executive_name'),
                current_price=int(float(data.get('price', 0))),
                renovation_cost=int(data.get('renovation_cost', 0)),
                status='unsold',
                
                # Customer/Seller
                customer_name=data.get('buyer_name'),
                customer_phone=data.get('customer_phone'),
                city_name=data.get('customer_city'),
                pincode=data.get('customer_pincode'),
                customer_address1=data.get('customer_address_line1'),
                customer_address2=data.get('customer_address_line2'),
                
                broker_name=data.get('broker_name'),
                scheme=data.get('scheme'),
                other_remarks=data.get('other_remarks'),
                # hp_name not in OldCar model
                email=data.get('buyer_email')
            )
            # Date mappings
            def parse_date(d_str):
                if d_str: 
                    try: return datetime.strptime(d_str, '%Y-%m-%d')
                    except: return None
                return None
            
            if data.get('customer_dob'): new_vehicle.customer_dob = parse_date(data.get('customer_dob'))
            if data.get('insurance_expiry'): new_vehicle.insurance_expiry_date = parse_date(data.get('insurance_expiry'))

        elif entry_type == 'sales' and data.get('is_old_car_sale'): 
             # Logic for Old Car Sell - assuming 'is_old_car_sale' flag or derived from somewhere
             # But AddCar uses 'Sale' type.
             # If type is 'sales' AND it's an old car...
             # Actually key is 'transaction_type'. AddCar sends 'Sale'. 
             # My normalization turns 'Sale' -> 'sales'.
             # I should check if it's Old Car Sale.
             pass 
             # For now, let's stick to New Car logic for 'sales' unless I'm sure.
             # BUT I need to handle 'OldCarSell' creation if intent is explicitly Old Car Sale.
             # The existing logic creates a 'Vehicle' (New Car).
             
             # Fallback to Vehicle (New Car) creation for now as it handles 'sales'
             # I will modify the 'else' block
             new_vehicle = Vehicle(
                transaction_type=entry_type,
                docket_number=data.get('docket_number'),
                manufacturer=data.get('manufacturer'),
                model=data.get('model'),
                year=str(data.get('year')) if data.get('year') else None,
                color=data.get('color'),
                fuel_type=data.get('fuel_type'),
                chassis_number=data.get('vin') or data.get('chassis_number'),
                engine_number=data.get('engine_number'),
                registration_number=data.get('registration_number'),
                running_km=int(data.get('running_km', 0)),
                rto_passing_status=data.get('rto_passing_status'),
                plate_type=data.get('plate_type'),
                executive_name=data.get('executive_name'),
                price=float(data.get('price', 0)) if data.get('price') else 0.0,
                status='sold' if entry_type == 'sales' else 'unsold',
                
                buyer_name=data.get('buyer_name'),
                buyer_email=data.get('buyer_email'),
                customer_phone=data.get('customer_phone'),
                city=data.get('customer_city'),
                pincode=data.get('customer_pincode'),
                address_line_1=data.get('customer_address_line1'),
                address_line_2=data.get('customer_address_line2'),
                broker_name=data.get('broker_name'),
                scheme=data.get('scheme'),
                other_remarks=data.get('other_remarks'),
                hp_name=data.get('hp') or data.get('hp_name'),
                nominee_name=data.get('nominee_name'),
                nominee_relation=data.get('nominee_relation')
            )
             
             # Date parsing helper
             def parse_date(d_str):
                if d_str: 
                    try: return datetime.strptime(d_str, '%Y-%m-%d')
                    except: return None
                return None

             if data.get('delivery_date'): new_vehicle.delivery_date = parse_date(data.get('delivery_date'))
             if data.get('booking_date'): new_vehicle.booking_date = parse_date(data.get('booking_date'))
             if data.get('customer_dob'): new_vehicle.customer_dob = parse_date(data.get('customer_dob'))
             if data.get('nominee_dob'): new_vehicle.nominee_dob = parse_date(data.get('nominee_dob'))

        else:
             # Default New Car Logic (duplicate of above 'elif' body for safety)
             # Wait, I can't put duplicate code in 'pass' block.
             # I'll just use the block above.
             new_vehicle = Vehicle(
                transaction_type=entry_type,
                docket_number=data.get('docket_number'),
                manufacturer=data.get('manufacturer'),
                model=data.get('model'),
                year=str(data.get('year')) if data.get('year') else None,
                color=data.get('color'),
                fuel_type=data.get('fuel_type'),
                chassis_number=data.get('vin') or data.get('chassis_number'),
                engine_number=data.get('engine_number'),
                registration_number=data.get('registration_number'),
                running_km=int(data.get('running_km', 0)),
                rto_passing_status=data.get('rto_passing_status'),
                plate_type=data.get('plate_type'),
                executive_name=data.get('executive_name'),
                price=float(data.get('price', 0)) if data.get('price') else 0.0,
                status='sold' if entry_type == 'sales' else 'unsold',
                
                buyer_name=data.get('buyer_name'),
                buyer_email=data.get('buyer_email'),
                customer_phone=data.get('customer_phone'),
                city=data.get('customer_city'),
                pincode=data.get('customer_pincode'),
                address_line_1=data.get('customer_address_line1'),
                address_line_2=data.get('customer_address_line2'),
                broker_name=data.get('broker_name'),
                scheme=data.get('scheme'),
                other_remarks=data.get('other_remarks'),
                hp_name=data.get('hp') or data.get('hp_name'),
                nominee_name=data.get('nominee_name'),
                nominee_relation=data.get('nominee_relation')
            )
             
             # Date parsing helper (re-defined or shared)
             def parse_date(d_str):
                if d_str: 
                    try: return datetime.strptime(d_str, '%Y-%m-%d')
                    except: return None
                return None

             if data.get('delivery_date'): new_vehicle.delivery_date = parse_date(data.get('delivery_date'))
             if data.get('booking_date'): new_vehicle.booking_date = parse_date(data.get('booking_date'))
             if data.get('customer_dob'): new_vehicle.customer_dob = parse_date(data.get('customer_dob'))
             if data.get('nominee_dob'): new_vehicle.nominee_dob = parse_date(data.get('nominee_dob'))

        db.session.add(new_vehicle)
        db.session.flush()

        # Handle Files
        # 1. Standard Static Files (Legacy or 'New Car' specific if any)
        for key, file in files.items():
            # Skip dynamic doc keys
            if key.startswith('doc_file_'): continue 
            
            if file and file.filename:
                safe_filename = secure_filename(f"{new_vehicle.id}_{key}_{file.filename}")
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
                file.save(save_path)

        # 2. Dynamic Documents (New System)
        # Format: doc_file_0, doc_name_0, ...
        i = 0
        while True:
            file_key = f'doc_file_{i}'
            name_key = f'doc_name_{i}'
            
            # Check if file key exists (even if empty file, the key might be there in FormData)
            if file_key not in request.files:
                # Break if sequence breaks? Or check next? 
                # FormData usually comes in order.
                # But to be safe, maybe check up to 20? 
                # Actually, standard is loop until break.
                break
                
            file = request.files[file_key]
            doc_name = request.form.get(name_key, f"Document {i+1}")
            
            if file and file.filename:
                ts = int(datetime.now().timestamp())
                safe_filename = secure_filename(f"{new_vehicle.id}_doc_{ts}_{i}_{file.filename}")
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
                file.save(save_path)
                
                file_url = f"/uploads/{safe_filename}"
                
                if entry_type == 'sales':
                    if data.get('transaction_type') == 'Sale':
                        # Old Car Sell -> OldCarSellDocument
                        doc = OldCarSellDocument(
                            sell_id=new_vehicle.id,
                            document_name=doc_name,
                            file_path=file_url
                        )
                        db.session.add(doc)
                    else:
                        # New Car -> VehicleDocument
                        doc = VehicleDocument(
                            vehicle_id=new_vehicle.id,
                            document_name=doc_name,
                            file_path=file_url,
                            document_type=file.content_type or 'application/octet-stream'
                        )
                        db.session.add(doc)
                
                elif entry_type == 'purchase':
                    # Old Car -> OldCarDocument
                    doc = OldCarDocument(
                        old_car_id=new_vehicle.id,
                        document_name=doc_name,
                        file_path=file_url
                    )
                    db.session.add(doc)

            i += 1
            
        db.session.commit()
            
        return jsonify({
            "success": True,
            "message": "Vehicle created successfully",
            "id": new_vehicle.id,
            "vehicle": new_vehicle.to_dict()
        }), 201


    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/vehicles/<int:id>', methods=['GET'])
def get_vehicle_detail(id):
    tx_type = request.args.get('type')
    
    # Priority Search based on Type Hint
    if tx_type == 'Purchase':
        old_car = db.session.get(OldCar, id)
        if old_car:
            d = old_car.to_dict()
            d['transaction_type'] = 'Purchase'
            return jsonify(d), 200
    elif tx_type == 'Sale':
        old_sell = db.session.get(OldCarSell, id)
        if old_sell:
            d = old_sell.to_dict()
            d['transaction_type'] = 'Sale'
            return jsonify(d), 200
        # If not found in Sell, check OldCar (maybe verifying stock to sell)
        old_car = db.session.get(OldCar, id)
        if old_car:
            d = old_car.to_dict()
            d['transaction_type'] = 'Purchase' # or Sale? Keep as source type
            return jsonify(d), 200
    elif tx_type == 'New':
        vehicle = db.session.get(Vehicle, id)
        if vehicle:
            d = vehicle.to_dict()
            if not d.get('transaction_type'): d['transaction_type'] = 'New'
            return jsonify(d), 200

    # Fallback to existing search order
    # Try New Car
    vehicle = db.session.get(Vehicle, id)
    if vehicle: 
        d = vehicle.to_dict()
        # Ensure transaction structure matches frontend expectation
        if not d.get('transaction_type'): d['transaction_type'] = 'New'
        return jsonify(d), 200
    
    # Try Old Car
    old_car = db.session.get(OldCar, id)
    if old_car:
        d = old_car.to_dict()
        d['transaction_type'] = 'Purchase'
        return jsonify(d), 200

    # Try Old Car Sell
    old_sell = db.session.get(OldCarSell, id)
    if old_sell:
        d = old_sell.to_dict()
        d['transaction_type'] = 'Sale'
        return jsonify(d), 200

    return jsonify({"error": "Not found"}), 404

@app.route('/api/vehicles/<int:id>', methods=['PUT', 'DELETE'])
def update_delete_vehicle(id):
    if request.method == 'DELETE':
        try:
            deleted = False
            # Try finding in all tables
            v = db.session.get(Vehicle, id)
            if v:
                db.session.delete(v)
                deleted = True
            
            if not deleted:
                oc = db.session.get(OldCar, id)
                if oc:
                    db.session.delete(oc)
                    deleted = True
            
            if not deleted:
                ocs = db.session.get(OldCarSell, id)
                if ocs:
                    db.session.delete(ocs)
                    deleted = True
            
            if deleted:
                db.session.commit()
                return jsonify({"success": True, "message": "Vehicle deleted"}), 200
            else:
                 return jsonify({"error": "Vehicle not found"}), 404
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": str(e)}), 500

    try:
        # Handle both JSON and multipart form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            files = request.files
        else:
            data = request.get_json()
            files = {}
        
        # Date parsing helper
        def parse_date(d_str):
            if d_str: 
                try: return datetime.strptime(d_str, '%Y-%m-%d').date()
                except: return None
            return None

        # Helper to update common fields
        def update_common_fields(obj, d):
            # Safe int converter
            def safe_int(val):
                if val is None or val == '': return 0
                try: return int(float(val)) # Handle "100.0" strings too
                except: return 0

            if d.get('docket_number') is not None: obj.docket_number = d.get('docket_number')
            if d.get('manufacturer'): 
                if hasattr(obj, 'manufacturer'): obj.manufacturer = d.get('manufacturer')
                elif hasattr(obj, 'manufacturer_name'): obj.manufacturer_name = d.get('manufacturer')
            if d.get('model'):
                if hasattr(obj, 'model'): obj.model = d.get('model')
                elif hasattr(obj, 'model_name'): obj.model_name = d.get('model')
            if d.get('year'):
                if hasattr(obj, 'year'): obj.year = str(d.get('year'))
                elif hasattr(obj, 'manufacture_year'): obj.manufacture_year = str(d.get('year'))
            if d.get('color'): obj.color = d.get('color')
            if d.get('fuel_type'): obj.fuel_type = d.get('fuel_type')
            
            # VIN/Chassis/Engine
            vin = d.get('vin') or d.get('chassis_number')
            if vin:
               if hasattr(obj, 'chassis_number'): obj.chassis_number = vin
               elif hasattr(obj, 'chassis_no'): obj.chassis_no = vin
            
            if d.get('engine_number'):
                if hasattr(obj, 'engine_number'): obj.engine_number = d.get('engine_number')
                elif hasattr(obj, 'engine_no'): obj.engine_no = d.get('engine_number')

            if d.get('registration_number'):
                if hasattr(obj, 'registration_number'): obj.registration_number = d.get('registration_number')
                elif hasattr(obj, 'registration_no'): obj.registration_no = d.get('registration_number')
            
            if d.get('running_km') is not None:
                val = safe_int(d.get('running_km'))
                if hasattr(obj, 'running_km'): obj.running_km = val
                elif hasattr(obj, 'running_kilometer'): obj.running_kilometer = val
            
            # Price
            if d.get('price') is not None:
                val = float(d.get('price', 0)) if d.get('price') else 0.0
                if hasattr(obj, 'price'): obj.price = val
                elif hasattr(obj, 'current_price'): obj.current_price = int(val)
            
            # Renovation Cost (Old Cars only)
            if d.get('renovation_cost') is not None and hasattr(obj, 'renovation_cost'):
                obj.renovation_cost = safe_int(d.get('renovation_cost'))

            # Status
            if d.get('status'): obj.status = d.get('status')
            
            # Customer fields
            # Fix: Prioritize 'customer_name' (form input) over 'buyer_name' (potential stale alias)
            buyer = d.get('customer_name') or d.get('buyer_name')
            if buyer:
                if hasattr(obj, 'buyer_name'): obj.buyer_name = buyer
                elif hasattr(obj, 'customer_name'): obj.customer_name = buyer
            
            # Fix: Prioritize 'customer_email' over 'buyer_email'
            email = d.get('customer_email') or d.get('buyer_email')
            if email:
                if hasattr(obj, 'buyer_email'): obj.buyer_email = email
                elif hasattr(obj, 'email'): obj.email = email
            
            if d.get('customer_phone'): obj.customer_phone = d.get('customer_phone')
            
            # Address/Location
            city = d.get('customer_city') or d.get('city')
            if city:
                if hasattr(obj, 'city'): obj.city = city
                elif hasattr(obj, 'city_name'): obj.city_name = city
                
            pincode = d.get('customer_pincode') or d.get('pincode')
            if pincode: obj.pincode = pincode
            
            # Fix: Prioritize 'customer_address_line1' if sent that way, but here we see 'customer_address_line1' vs 'address_line_1'
            # The form likely sends 'customer_address_line1'
            addr1 = d.get('customer_address_line1') or d.get('address_line_1')
            if addr1:
                 if hasattr(obj, 'address_line_1'): obj.address_line_1 = addr1
                 elif hasattr(obj, 'customer_address1'): obj.customer_address1 = addr1
            
            addr2 = d.get('customer_address_line2') or d.get('address_line_2')
            if addr2:
                 if hasattr(obj, 'address_line_2'): obj.address_line_2 = addr2
                 elif hasattr(obj, 'customer_address2'): obj.customer_address2 = addr2

            if d.get('executive_name'): obj.executive_name = d.get('executive_name')
            if d.get('other_remarks'): obj.other_remarks = d.get('other_remarks')

            # RTO & Plate Mappings (critical for OldCarSell)
            if d.get('rto_passing_status'):
                if hasattr(obj, 'rto_passing_status'): obj.rto_passing_status = d.get('rto_passing_status')
                elif hasattr(obj, 'parsing_status'): obj.parsing_status = d.get('rto_passing_status')

            if d.get('plate_type'):
                if hasattr(obj, 'plate_type'): obj.plate_type = d.get('plate_type')
                elif hasattr(obj, 'number_plate'): obj.number_plate = d.get('plate_type')
                
            if d.get('hp'):
                if hasattr(obj, 'hp_name'): obj.hp_name = d.get('hp')

            # --- DATE FIELDS (critical for Customer Details modal) ---
            if d.get('booking_date') and hasattr(obj, 'booking_date'):
                obj.booking_date = parse_date(d.get('booking_date'))
            if d.get('delivery_date') and hasattr(obj, 'delivery_date'):
                obj.delivery_date = parse_date(d.get('delivery_date'))
            # buyer_dob from modal maps to customer_dob on Vehicle
            dob = d.get('buyer_dob') or d.get('customer_dob')
            if dob:
                if hasattr(obj, 'customer_dob'): obj.customer_dob = parse_date(dob)
                elif hasattr(obj, 'buyer_dob'): obj.buyer_dob = parse_date(dob)

            # --- PRICING BREAKDOWN (stored as JSON text) ---
            if d.get('vehicle_pricing_breakdown') and hasattr(obj, 'vehicle_pricing_breakdown'):
                obj.vehicle_pricing_breakdown = d.get('vehicle_pricing_breakdown')

            # --- DELIVERY STATUS / STATUS from modal dropdown ---
            if d.get('delivery_status'):
                if hasattr(obj, 'delivery_status'): obj.delivery_status = d.get('delivery_status')


        # IDENTIFY TARGET
        target = None
        tx_type = data.get('transaction_type')
        
        if not tx_type:
             return jsonify({"error": "transaction_type is required"}), 400

        if tx_type == 'New':
            target = db.session.get(Vehicle, id)
        elif tx_type == 'Purchase':
            target = db.session.get(OldCar, id)
        elif tx_type == 'Sale':
            target = db.session.get(OldCarSell, id)
        else:
            return jsonify({"error": f"Invalid transaction_type: {tx_type}"}), 400
        
        if not target:
            return jsonify({"error": f"Vehicle not found in {tx_type} table"}), 404
        
        # UPDATE
        update_common_fields(target, data)
        
        # Handle New Documents (Append)
        # Dynamic Documents
        i = 0
        while True:
            file_key = f'doc_file_{i}'
            name_key = f'doc_name_{i}'
            if file_key not in request.files: break
            
            file = request.files[file_key]
            doc_name = request.form.get(name_key, f"Document {i+1}")
            
            if file and file.filename:
                ts = int(datetime.now().timestamp())
                safe_filename = secure_filename(f"{target.id}_doc_{ts}_{i}_{file.filename}")
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
                try:
                    file.save(save_path)
                    file_url = f"/uploads/{safe_filename}"
                    
                    if tx_type == 'New':
                        doc = VehicleDocument(
                            vehicle_id=target.id,
                            document_name=doc_name,
                            file_path=file_url,
                            document_type=file.content_type or 'application/octet-stream'
                        )
                        db.session.add(doc)
                    elif tx_type == 'Purchase':
                        doc = OldCarDocument(
                            old_car_id=target.id,
                            document_name=doc_name,
                            file_path=file_url
                        )
                        db.session.add(doc)
                    elif tx_type == 'Sale':
                        doc = OldCarSellDocument(
                            sell_id=target.id,
                            document_name=doc_name,
                            file_path=file_url
                        )
                        db.session.add(doc)
                except Exception as doc_err:
                    print(f"Error adding document during update: {doc_err}")
            i += 1

        db.session.commit()
        return jsonify({"success": True, "vehicle": target.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating vehicle: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


# ----------------- DASHBOARD & INQUIRIES -----------------

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    try:
        # Initialize defaults to prevent NameError if queries fail or logic jumps
        total_vehicles = 0
        sold_vehicles = 0
        available_vehicles = 0
        total_revenue = 0.0
        total_inquiries = 0
        pending_inquiries = 0
        total_finances = 0
        total_insurances = 0
        sales_data = []
        upcoming_insurances = []

        # Inventory Stats
        total_vehicles = db.session.query(Vehicle).count()
        sold_vehicles = db.session.query(Vehicle).filter(Vehicle.status == 'sold').count() 
        available_vehicles = db.session.query(Vehicle).filter(Vehicle.status == 'unsold').count()
        
        # Revenue (Sum of price for Sold vehicles)
        revenue_result = db.session.query(db.func.sum(Vehicle.price)).filter(Vehicle.status == 'sold').scalar()
        total_revenue = float(revenue_result) if revenue_result else 0.0

        # Inquiries
        total_inquiries = db.session.query(Inquiry).count()
        pending_inquiries = db.session.query(Inquiry).filter(Inquiry.status == 'pending').count()
        
        # Finance Stats
        total_finances = db.session.query(FinanceRecord).count()
        
        # Insurance Stats
        total_insurances = db.session.query(Insurance).count()
        
        if True: # Indentation hack
            import sys
            print("--- DASHBOARD STATS CALLED ---", file=sys.stderr)
        
        # Upcoming Insurance Expiries (within 10 days)
        from datetime import datetime, timedelta
        today = datetime.now().date()
        ten_days_later = today + timedelta(days=10)
        
        # Fetch insurances expiring soon
        upcoming_insurances_query = db.session.query(Insurance).all()
        print(f"Found {len(upcoming_insurances_query)} insurances", file=sys.stderr)
        upcoming_insurances = []
        
        for ins in upcoming_insurances_query:
            if ins.expiry_date:
                try:
                    expiry = None
                    # Parse expiry date - handle different formats or types
                    if isinstance(ins.expiry_date, (datetime, date)):
                         expiry = ins.expiry_date if isinstance(ins.expiry_date, date) else ins.expiry_date.date()
                    elif isinstance(ins.expiry_date, str):
                        # Try different date formats
                        date_str = ins.expiry_date.strip()
                        # Add formats: 'Fri, 27 Feb 2026', '27 Feb 2026', ISO
                        formats = [
                            '%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d',
                            '%a, %d %b %Y', '%d %b %Y', 
                            '%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S'
                        ]
                        for fmt in formats:
                            try:
                                expiry = datetime.strptime(date_str, fmt).date()
                                break
                            except:
                                continue
                    
                    if expiry and today <= expiry <= ten_days_later:
                        # Get vehicle details if available
                        vehicle = db.session.get(Vehicle, ins.vehicle_id) if ins.vehicle_id else None
                        car_name = f"{vehicle.manufacturer} {vehicle.model}" if vehicle else "Unknown Vehicle"
                        
                        days_remaining = (expiry - today).days
                        status = f"{days_remaining} Days Remaining" if days_remaining > 0 else "Expiring Soon"
                        
                        upcoming_insurances.append({
                            "car_id": f"#CAR-{ins.vehicle_id}" if ins.vehicle_id else f"#INS-{ins.id}",
                            "car_name": car_name,
                            "expiry_date": expiry.strftime('%d %b %Y'),
                            "status": status
                        })
                except Exception as e:
                    print(f"Error parsing expiry date for insurance {ins.id}: {e}")
                    continue

        # Mock sales data for the chart
        sales_data = [
            {"name": "Jan", "sales": 4000, "prediction": 4200},
            {"name": "Feb", "sales": 3000, "prediction": 3200},
            {"name": "Mar", "sales": 5000, "prediction": 5100},
            {"name": "Apr", "sales": 4500, "prediction": 4700},
            {"name": "May", "sales": 6000, "prediction": 6200},
            {"name": "Jun", "sales": 5500, "prediction": 5800},
            {"name": "Jul", "sales": 7000, "prediction": 7300},
            {"name": "Aug", "sales": 6500, "prediction": 6900},
            {"name": "Sep", "sales": 8000, "prediction": 8400},
            {"name": "Oct", "sales": 7500, "prediction": 8000},
            {"name": "Nov", "sales": 9000, "prediction": 9500},
            {"name": "Dec", "sales": 8500, "prediction": 9200},
        ]

        return jsonify({
            # Vehicle stats with aliases
            "totalVehicles": total_vehicles,
            "total_vehicles": total_vehicles,
            "soldVehicles": sold_vehicles,
            "sold_vehicles": sold_vehicles,
            "availableVehicles": available_vehicles,
            "available_vehicles": available_vehicles,
            
            # Revenue with aliases
            "totalRevenue": total_revenue,
            "total_revenue": total_revenue,
            "revenue": total_revenue,
            
            # Inquiry stats with aliases
            "totalInquiries": total_inquiries,
            "total_inquiries": total_inquiries,
            "pendingInquiries": pending_inquiries,
            "pending_inquiries": pending_inquiries,
            
            # Additional stats
            "totalFinances": total_finances,
            "total_finances": total_finances,
            "totalInsurances": total_insurances,
            "total_insurances": total_insurances,
            
            # Sales data for chart
            "salesData": sales_data,
            
            # Upcoming insurance expiries
            "upcomingInsurances": upcoming_insurances
        }), 200
    except Exception as e:
        print(f"Error fetching stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
@app.route('/api/inquiries', methods=['GET', 'POST'])
def inquiries_handler():
    if request.method == 'GET':
        inquiries = db.session.execute(db.select(Inquiry).order_by(Inquiry.id.desc())).scalars().all()
        return jsonify([i.to_dict() for i in inquiries]), 200

    if request.method == 'POST':
        data = request.get_json()
        print(f"Received inquiry data: {data}") # Debug log
        try:
            # Saniitze inputs to prevent DB constraints/Enum crashes
            source = data.get('source')
            if not source:
                source = 'walk-in'
            
            contact = data.get('contactMethod')
            if contact:
                contact = contact.lower()

            new_inquiry = Inquiry(
                customer_name=data.get('customer'),
                customer_email=data.get('email'),
                customer_phone=data.get('customerPhone'),
                vehicle_of_interest=data.get('vehicle'),
                preferred_contact_method=contact,
                additional_notes=data.get('notes'),
                inquiry_source=source,
                status='pending'
            )
            db.session.add(new_inquiry)
            db.session.commit()
            return jsonify({"success": True, "inquiry": new_inquiry.to_dict()}), 201
        except Exception as e:
            db.session.rollback()
            print(f"Error creating inquiry: {e}") # Debug log
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 400

@app.route('/api/inquiries/<int:id>', methods=['GET'])
def get_inquiry(id):
    inquiry = db.session.get(Inquiry, id)
    if not inquiry:
        return jsonify({"error": "Inquiry not found"}), 404
    return jsonify(inquiry.to_dict()), 200

@app.route('/api/inquiries/<int:id>', methods=['PUT'])
def update_inquiry(id):
    try:
        inquiry = db.session.get(Inquiry, id)
        if not inquiry:
            return jsonify({"success": False, "message": "Inquiry not found"}), 404
        
        data = request.get_json()
        
        if data.get('customer'):
            inquiry.customer_name = data.get('customer')
        if data.get('email'):
            inquiry.customer_email = data.get('email')
        if data.get('customerPhone'):
            inquiry.customer_phone = data.get('customerPhone')
        if data.get('vehicle'):
            inquiry.vehicle_of_interest = data.get('vehicle')
        if data.get('contactMethod'):
            inquiry.preferred_contact_method = data.get('contactMethod')
        if data.get('notes'):
            inquiry.additional_notes = data.get('notes')
        if data.get('source'):
            inquiry.inquiry_source = data.get('source')
        if data.get('status'):
            inquiry.status = data.get('status')
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "inquiry": inquiry.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating inquiry: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route('/api/inquiries/<int:id>', methods=['DELETE'])
def delete_inquiry(id):
    try:
        inquiry = db.session.get(Inquiry, id)
        if not inquiry:
            return jsonify({"success": False, "message": "Inquiry not found"}), 404
        
        db.session.delete(inquiry)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Inquiry deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting inquiry: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ----------------- INSURANCES ENDPOINTS -----------------

@app.route('/api/insurances', methods=['GET'])
def get_insurances():
    try:
        insurances = db.session.execute(db.select(Insurance).order_by(Insurance.id.desc())).scalars().all()
        
        # Extended to_dict for frontend compatibility
        result = []
        for ins in insurances:
            # Get vehicle details if vehicle_id exists
            vehicle = None
            if ins.vehicle_id:
                vehicle = db.session.get(Vehicle, ins.vehicle_id)
            
            result.append({
                "id": ins.id,
                "bank_name": ins.bank_name,
                "branch": ins.branch,
                "customer_name": ins.customer_name,
                "customer_phone": None,  # Not in insurances table
                "address": ins.address,
                "amount": ins.total_amount,
                "premium_amount": ins.premium_amount,
                "insurance_company": ins.insurance_company,
                "expiry_date": ins.expiry_date,
                "vehicle_id": ins.vehicle_id,
                "car": vehicle.model if vehicle else None,
                "registration_number": vehicle.registration_number if vehicle else None,
                "old_policy_url": ins.old_policy_url,
                "new_policy_url": ins.new_policy_url
            })
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching insurances: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/insurances', methods=['POST'])
def create_insurance():
    try:
        data = request.get_json()
        
        new_insurance = Insurance(
            vehicle_id=data.get('vehicle_id'),
            bank_name=data.get('bank_name'),
            branch=data.get('branch'),
            customer_name=data.get('customer_name'),
            address=data.get('address'),
            total_amount=float(data.get('amount', 0)),
            premium_amount=float(data.get('premium_amount', 0)),
            insurance_company=data.get('insurance_company'),
            expiry_date=data.get('expiry_date')
        )
        
        db.session.add(new_insurance)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "insurance": new_insurance.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating insurance: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route('/api/insurances/<int:id>', methods=['GET'])
def get_insurance(id):
    insurance = db.session.get(Insurance, id)
    if not insurance:
        return jsonify({"error": "Insurance record not found"}), 404
    
    # Get vehicle details
    vehicle = None
    if insurance.vehicle_id:
        vehicle = db.session.get(Vehicle, insurance.vehicle_id)
    
    result = {
        "id": insurance.id,
        "bank_name": insurance.bank_name,
        "branch": insurance.branch,
        "customer_name": insurance.customer_name,
        "address": insurance.address,
        "amount": insurance.total_amount,
        "premium_amount": insurance.premium_amount,
        "insurance_company": insurance.insurance_company,
        "expiry_date": insurance.expiry_date,
        "vehicle_id": insurance.vehicle_id,
        "car": vehicle.model if vehicle else None,
        "registration_number": vehicle.registration_number if vehicle else None,
        "old_policy_url": insurance.old_policy_url,
        "new_policy_url": insurance.new_policy_url
    }
    
    return jsonify(result), 200

@app.route('/api/insurances/<int:id>', methods=['PUT'])
def update_insurance(id):
    try:
        insurance = db.session.get(Insurance, id)
        if not insurance:
            return jsonify({"success": False, "message": "Insurance not found"}), 404
        
        data = request.get_json()
        
        if data.get('vehicle_id') is not None:
            insurance.vehicle_id = data.get('vehicle_id')
        if data.get('bank_name'):
            insurance.bank_name = data.get('bank_name')
        if data.get('branch'):
            insurance.branch = data.get('branch')
        if data.get('customer_name'):
            insurance.customer_name = data.get('customer_name')
        if data.get('address'):
            insurance.address = data.get('address')
        if data.get('amount') is not None:
            insurance.total_amount = float(data.get('amount'))
        if data.get('premium_amount') is not None:
            insurance.premium_amount = float(data.get('premium_amount'))
        if data.get('insurance_company'):
            insurance.insurance_company = data.get('insurance_company')
        if data.get('expiry_date'):
            insurance.expiry_date = data.get('expiry_date')
        if data.get('old_policy_url'):
            insurance.old_policy_url = data.get('old_policy_url')
        if data.get('new_policy_url'):
            insurance.new_policy_url = data.get('new_policy_url')
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "insurance": insurance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating insurance: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route('/api/insurances/<int:id>', methods=['DELETE'])
def delete_insurance(id):
    try:
        insurance = db.session.get(Insurance, id)
        if not insurance:
            return jsonify({"success": False, "message": "Insurance not found"}), 404
        
        db.session.delete(insurance)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Insurance deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting insurance: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ----------------- FINANCES ENDPOINTS -----------------

@app.route('/api/finances', methods=['GET'])
def get_finances():
    try:
        finances = db.session.execute(db.select(FinanceRecord).order_by(FinanceRecord.id.desc())).scalars().all()
        
        # Extended to_dict for frontend compatibility
        result = []
        for fin in finances:
            # Get vehicle details if vehicle_id exists
            vehicle = None
            if fin.vehicle_id:
                vehicle = db.session.get(Vehicle, fin.vehicle_id)
            
            fin_dict = fin.to_dict()
            fin_dict['car'] = vehicle.model if vehicle else None
            fin_dict['registration_number'] = vehicle.registration_number if vehicle else None
            result.append(fin_dict)
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching finances: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/finances', methods=['POST'])
def create_finance():
    try:
        data = request.get_json()
        
        # Date parsing helper
        def parse_date(d_str):
            if d_str:
                try: 
                    return datetime.strptime(d_str, '%Y-%m-%d').date()
                except: 
                    return None
            return None
        
        new_finance = FinanceRecord(
            vehicle_id=data.get('vehicle_id') or data.get('car_id'),
            bank_name=data.get('bank_name'),
            bank_branch=data.get('bank_branch'),
            customer_name=data.get('customer_name'),
            account_number=data.get('account_number'),
            address=data.get('address'),
            contact_number=data.get('contact_number'),
            email=data.get('email'),
            starting_date=parse_date(data.get('starting_date')),
            ending_date=parse_date(data.get('ending_date')),
            amount=float(data.get('amount')) if data.get('amount') else None,
            loan_protection=data.get('loan_protection'),
            disbursement_amount=float(data.get('disbursement_amount')) if data.get('disbursement_amount') else None,
            disbursement_date=parse_date(data.get('disbursement_date')),
            status=data.get('status'),
            emi_amount=float(data.get('emi_amount')) if data.get('emi_amount') else None,
            executive=data.get('executive'),
            payment_out=0.0
        )
        
        db.session.add(new_finance)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "finance": new_finance.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating finance: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route('/api/finances/<int:id>', methods=['GET'])
def get_finance(id):
    finance = db.session.get(FinanceRecord, id)
    if not finance:
        return jsonify({"error": "Finance record not found"}), 404
    
    # Get vehicle details
    vehicle = None
    if finance.vehicle_id:
        vehicle = db.session.get(Vehicle, finance.vehicle_id)
    
    result = finance.to_dict()
    result['car'] = vehicle.model if vehicle else None
    result['registration_number'] = vehicle.registration_number if vehicle else None
    
    return jsonify(result), 200

@app.route('/api/finances/<int:id>', methods=['PUT'])
def update_finance(id):
    try:
        finance = db.session.get(FinanceRecord, id)
        if not finance:
            return jsonify({"success": False, "message": "Finance not found"}), 404
        
        data = request.get_json()
        
        # Date parsing helper
        def parse_date(d_str):
            if d_str:
                try: 
                    return datetime.strptime(d_str, '%Y-%m-%d').date()
                except: 
                    return None
            return None
        
        if data.get('vehicle_id') or data.get('car_id'):
            finance.vehicle_id = data.get('vehicle_id') or data.get('car_id')
        if data.get('bank_name'):
            finance.bank_name = data.get('bank_name')
        if data.get('bank_branch'):
            finance.bank_branch = data.get('bank_branch')
        if data.get('customer_name'):
            finance.customer_name = data.get('customer_name')
        if data.get('account_number'):
            finance.account_number = data.get('account_number')
        if data.get('address'):
            finance.address = data.get('address')
        if data.get('contact_number'):
            finance.contact_number = data.get('contact_number')
        if data.get('email'):
            finance.email = data.get('email')
        if data.get('starting_date'):
            finance.starting_date = parse_date(data.get('starting_date'))
        if data.get('ending_date'):
            finance.ending_date = parse_date(data.get('ending_date'))
        if data.get('amount') is not None:
            finance.amount = float(data.get('amount'))
        if data.get('loan_protection'):
            finance.loan_protection = data.get('loan_protection')
        if data.get('disbursement_amount') is not None:
            finance.disbursement_amount = float(data.get('disbursement_amount'))
        if data.get('disbursement_date'):
            finance.disbursement_date = parse_date(data.get('disbursement_date'))
        if data.get('status'):
            finance.status = data.get('status')
        if data.get('emi_amount') is not None:
            finance.emi_amount = float(data.get('emi_amount'))
        if data.get('executive'):
            finance.executive = data.get('executive')
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "finance": finance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating finance: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route('/api/finances/<int:id>', methods=['DELETE'])
def delete_finance(id):
    try:
        finance = db.session.get(FinanceRecord, id)
        if not finance:
            return jsonify({"success": False, "message": "Finance not found"}), 404
        
        db.session.delete(finance)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Finance deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting finance: {e}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@app.route('/')
def index():
    return "Lyrcon API Backend (Schema Aligned) is Running."


@app.route('/api/decode-vin/<vin>', methods=['GET'])
def decode_vin(vin):
    # Mock response for VIN decoding
    return jsonify({
        "Make": "Demo Manufacturer",
        "Model": "Demo Model",
        "ModelYear": "2024",
        "FuelTypePrimary": "Petrol"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
