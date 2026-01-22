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

CORS(app)
db.init_app(app)

# ----------------- MODELS -----------------

class User(db.Model):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    # Map 'name' in python to 'full_name' in DB
    name: Mapped[str] = mapped_column("full_name", String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user")
    
    # Missing columns in legacy schema: phone, location
    # We remove them to avoid "column does not exist" errors
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "phone": None, # Stubbed
            "location": None # Stubbed
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
            "transaction_type": self.transaction_type,
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
            "status": self.status
        }

class OldCarSell(db.Model):
    __tablename__ = 'old_cars_sell'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    docket_number: Mapped[str] = mapped_column(String(20), nullable=True)
    
    # Pricing
    original_price: Mapped[int] = mapped_column(Integer, nullable=True)
    current_price: Mapped[int] = mapped_column(Integer, nullable=True)
    
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
            "status": self.status
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
    
    def to_dict(self):
        return {
            "id": self.id,
            "bank_name": self.bank_name,
            "customer_name": self.customer_name,
            "amount": self.total_amount,
            "expiry_date": self.expiry_date
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
        total = db.session.query(Vehicle).count()
        sales = db.session.query(Vehicle).filter(Vehicle.transaction_type == 'sales').count()
        unsold = db.session.query(Vehicle).filter(Vehicle.status == 'unsold').count()
        sold = db.session.query(Vehicle).filter(Vehicle.status == 'sold').count()
        
        return jsonify({
            "total": total,
            "sales": sales,
            "unsold": unsold,
            "sold": sold
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

        # Default to 'sales' if not provided (Legacy DB constraint)
        entry_type = data.get('transaction_type', 'sales').lower()
        if entry_type == 'sale': entry_type = 'sales' # Normalize

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
            
            # Additional Fields
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

        db.session.add(new_vehicle)
        db.session.flush()

        # Handle Files
        for key, file in files.items():
            if file and file.filename:
                safe_filename = secure_filename(f"{new_vehicle.id}_{key}_{file.filename}")
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
                file.save(save_path)

                new_doc = VehicleDocument(
                    vehicle_id=new_vehicle.id,
                    document_name=key, # or file.filename
                    file_path=safe_filename,
                    document_type=key # using key as type
                )
                db.session.add(new_doc)

        db.session.commit()
        return jsonify({"success": True, "id": new_vehicle.id, "vehicle": new_vehicle.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/vehicles/<int:id>', methods=['GET'])
def get_vehicle_detail(id):
    vehicle = db.session.get(Vehicle, id)
    if not vehicle: return jsonify({"error": "Not found"}), 404
    return jsonify(vehicle.to_dict()), 200

@app.route('/api/vehicles/<int:id>', methods=['PUT'])
def update_vehicle(id):
    try:
        vehicle = db.session.get(Vehicle, id)
        if not vehicle: 
            return jsonify({"error": "Vehicle not found"}), 404
        
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
                try: 
                    return datetime.strptime(d_str, '%Y-%m-%d').date()
                except: 
                    return None
            return None
        
        # Update fields if provided
        if data.get('docket_number') is not None:
            vehicle.docket_number = data.get('docket_number')
        if data.get('transaction_type'):
            entry_type = data.get('transaction_type', 'sales').lower()
            if entry_type == 'sale': entry_type = 'sales'
            vehicle.transaction_type = entry_type
        if data.get('manufacturer'):
            vehicle.manufacturer = data.get('manufacturer')
        if data.get('model'):
            vehicle.model = data.get('model')
        if data.get('year'):
            vehicle.year = str(data.get('year'))
        if data.get('color'):
            vehicle.color = data.get('color')
        if data.get('fuel_type'):
            vehicle.fuel_type = data.get('fuel_type')
        if data.get('vin') or data.get('chassis_number'):
            vehicle.chassis_number = data.get('vin') or data.get('chassis_number')
        if data.get('engine_number'):
            vehicle.engine_number = data.get('engine_number')
        if data.get('registration_number'):
            vehicle.registration_number = data.get('registration_number')
        if data.get('running_km') is not None:
            vehicle.running_km = int(data.get('running_km', 0))
        if data.get('rto_passing_status'):
            vehicle.rto_passing_status = data.get('rto_passing_status')
        if data.get('plate_type'):
            vehicle.plate_type = data.get('plate_type')
        if data.get('rto_name'):
            vehicle.rto_name = data.get('rto_name')
        if data.get('rto_code'):
            vehicle.rto_code = data.get('rto_code')
        if data.get('choice_number'):
            vehicle.choice_number = data.get('choice_number')
        if data.get('executive_name'):
            vehicle.executive_name = data.get('executive_name')
        if data.get('location'):
            vehicle.location = data.get('location')
        if data.get('dealer') or data.get('dealer_name'):
            vehicle.dealer = data.get('dealer') or data.get('dealer_name')
        if data.get('price') is not None:
            vehicle.price = float(data.get('price', 0)) if data.get('price') else 0.0
        if data.get('status'):
            vehicle.status = data.get('status')
        
        # Customer fields
        if data.get('buyer_name') or data.get('customer_name'):
            vehicle.buyer_name = data.get('buyer_name') or data.get('customer_name')
        if data.get('buyer_email') or data.get('customer_email'):
            vehicle.buyer_email = data.get('buyer_email') or data.get('customer_email')
        if data.get('customer_phone'):
            vehicle.customer_phone = data.get('customer_phone')
        if data.get('customer_city') or data.get('city'):
            vehicle.city = data.get('customer_city') or data.get('city')
        if data.get('customer_pincode') or data.get('pincode'):
            vehicle.pincode = data.get('customer_pincode') or data.get('pincode')
        if data.get('customer_address_line1') or data.get('address_line_1'):
            vehicle.address_line_1 = data.get('customer_address_line1') or data.get('address_line_1')
        if data.get('customer_address_line2') or data.get('address_line_2'):
            vehicle.address_line_2 = data.get('customer_address_line2') or data.get('address_line_2')
        
        # Broker fields
        if data.get('broker_name'):
            vehicle.broker_name = data.get('broker_name')
        if data.get('scheme'):
            vehicle.scheme = data.get('scheme')
        if data.get('other_remarks'):
            vehicle.other_remarks = data.get('other_remarks')
        if data.get('hp') or data.get('hp_name'):
            vehicle.hp_name = data.get('hp') or data.get('hp_name')
        
        # Nominee fields
        if data.get('nominee_name'):
            vehicle.nominee_name = data.get('nominee_name')
        if data.get('nominee_relation') or data.get('nominee_relationship'):
            vehicle.nominee_relation = data.get('nominee_relation') or data.get('nominee_relationship')
        
        # Date fields
        if data.get('delivery_date'):
            vehicle.delivery_date = parse_date(data.get('delivery_date'))
        if data.get('booking_date'):
            vehicle.booking_date = parse_date(data.get('booking_date'))
        if data.get('customer_dob'):
            vehicle.customer_dob = parse_date(data.get('customer_dob'))
        if data.get('nominee_dob'):
            vehicle.nominee_dob = parse_date(data.get('nominee_dob'))
        
        # Handle file uploads if present
        for key, file in files.items():
            if file and file.filename:
                safe_filename = secure_filename(f"{vehicle.id}_{key}_{file.filename}")
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
                file.save(save_path)
                
                # Check if document already exists, update or create
                existing_doc = db.session.execute(
                    db.select(VehicleDocument).filter_by(vehicle_id=vehicle.id, document_name=key)
                ).scalar_one_or_none()
                
                if existing_doc:
                    existing_doc.file_path = safe_filename
                else:
                    new_doc = VehicleDocument(
                        vehicle_id=vehicle.id,
                        document_name=key,
                        file_path=safe_filename,
                        document_type=key
                    )
                    db.session.add(new_doc)
        
        db.session.commit()
        return jsonify({"success": True, "vehicle": vehicle.to_dict()}), 200
        
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
        
        # Upcoming Insurance Expiries (within 30 days)
        from datetime import datetime, timedelta
        today = datetime.now().date()
        thirty_days_later = today + timedelta(days=30)
        
        # Fetch insurances expiring soon
        upcoming_insurances_query = db.session.query(Insurance).all()
        upcoming_insurances = []
        
        for ins in upcoming_insurances_query:
            if ins.expiry_date:
                try:
                    # Parse expiry date - handle different formats
                    if isinstance(ins.expiry_date, str):
                        # Try different date formats
                        expiry = None
                        for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d']:
                            try:
                                expiry = datetime.strptime(ins.expiry_date, fmt).date()
                                break
                            except:
                                continue
                        
                        if expiry and today <= expiry <= thirty_days_later:
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
        try:
            new_inquiry = Inquiry(
                customer_name=data.get('customer'),
                customer_email=data.get('email'),
                customer_phone=data.get('customerPhone'),
                vehicle_of_interest=data.get('vehicle'),
                preferred_contact_method=data.get('contactMethod'),
                additional_notes=data.get('notes'),
                inquiry_source=data.get('source'),
                status='pending'
            )
            db.session.add(new_inquiry)
            db.session.commit()
            return jsonify({"success": True, "inquiry": new_inquiry.to_dict()}), 201
        except Exception as e:
            db.session.rollback()
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
                "registration_number": vehicle.registration_number if vehicle else None
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
        "registration_number": vehicle.registration_number if vehicle else None
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
            executive=data.get('executive')
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
