from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, Boolean, Date, DateTime, Text, ForeignKey
from datetime import datetime, date
import os
import requests
from werkzeug.utils import secure_filename

class Base(DeclarativeBase):
  pass

db = SQLAlchemy(model_class=Base)

app = Flask(__name__)
# Database Configuration
# Database Configuration
# Use DATABASE_URL env var if available (Production), else fallback to local (Dev)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/lyrcon")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CORS(app)
db.init_app(app)


class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="User")
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    location: Mapped[str] = mapped_column(String(200), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "phone": self.phone,
            "location": self.location
        }

class Vehicle(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_type: Mapped[str] = mapped_column(String(50))
    docket_number: Mapped[str] = mapped_column(String(50), nullable=True)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=True)
    model: Mapped[str] = mapped_column(String(100), nullable=True)
    year: Mapped[int] = mapped_column(Integer, nullable=True)
    color: Mapped[str] = mapped_column(String(50), nullable=True)
    fuel_type: Mapped[str] = mapped_column(String(50), nullable=True)
    chassis_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)
    engine_number: Mapped[str] = mapped_column(String(100), nullable=True)
    hp_name: Mapped[str] = mapped_column(String(100), nullable=True)
    registration_number: Mapped[str] = mapped_column(String(50), nullable=True)
    running_km: Mapped[float] = mapped_column(Float, default=0.0)
    rto_code: Mapped[str] = mapped_column(String(50), nullable=True)
    rto_name: Mapped[str] = mapped_column(String(100), nullable=True)
    rto_passing_status: Mapped[str] = mapped_column(String(50), nullable=True)
    plate_type: Mapped[str] = mapped_column(String(50), nullable=True)
    
    executive_branch: Mapped[str] = mapped_column(String(100), nullable=True)
    executive_name: Mapped[str] = mapped_column(String(100), nullable=True)
    executive_number: Mapped[str] = mapped_column(String(50), nullable=True)
    insurance_company: Mapped[str] = mapped_column(String(100), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default='Available')
    
    delivery_date: Mapped[datetime] = mapped_column(DateTime, nullable=True) 
    
    buyer_name: Mapped[str] = mapped_column(String(100), nullable=True)
    buyer_address: Mapped[str] = mapped_column(Text, nullable=True)
    buyer_email: Mapped[str] = mapped_column(String(100), nullable=True)
    buyer_dob: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    nominee_name: Mapped[str] = mapped_column(String(100), nullable=True)
    nominee_relation: Mapped[str] = mapped_column(String(50), nullable=True)
    nominee_dob: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    broker_name: Mapped[str] = mapped_column(String(100), nullable=True)
    broker_number: Mapped[str] = mapped_column(String(50), nullable=True)
    brokerage_amount: Mapped[float] = mapped_column(Float, nullable=True)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    
    # New Fields for Revamp
    booking_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    customer_remaining_amount: Mapped[float] = mapped_column(Float, default=0.0)
    net_short_amount: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Customer Address
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=True)
    address_line_1: Mapped[str] = mapped_column(String(255), nullable=True)
    address_line_2: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # JSON/Text fields for structured data (Simplified as Text for SQLite compatibility if needed, though PG supports JSON)
    # Storing as standard Text/String for maximum compatibility in this demo setup
    dealer_payment_history: Mapped[str] = mapped_column(Text, nullable=True) # JSON string
    vehicle_pricing_breakdown: Mapped[str] = mapped_column(Text, nullable=True) # JSON string for Customer side
    dealer_pricing_breakdown: Mapped[str] = mapped_column(Text, nullable=True) # JSON string for Dealer side

    # Additional missing fields
    entry_type: Mapped[str] = mapped_column(String(50), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=True)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    customer_email: Mapped[str] = mapped_column(String(120), nullable=True)
    customer_dob: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    dealer: Mapped[str] = mapped_column(String(100), nullable=True)
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    choice_number: Mapped[str] = mapped_column(String(50), nullable=True)
    insurance_expiry: Mapped[str] = mapped_column(String(20), nullable=True) # Storing as string or Date
    scheme: Mapped[str] = mapped_column(String(100), nullable=True)
    other_remarks: Mapped[str] = mapped_column(Text, nullable=True)
    hp: Mapped[str] = mapped_column(String(50), nullable=True)

    # Legacy Dump Fields
    rto_tax: Mapped[float] = mapped_column(Float, default=0.0)
    insurance_amount: Mapped[float] = mapped_column(Float, default=0.0)
    amc_gmc_tax: Mapped[float] = mapped_column(Float, default=0.0)
    ext_warranty: Mapped[float] = mapped_column(Float, default=0.0)
    accessories_amount: Mapped[float] = mapped_column(Float, default=0.0)
    krunal_accessories: Mapped[float] = mapped_column(Float, default=0.0)
    hypothecation: Mapped[str] = mapped_column(String(100), nullable=True) # For hp/hypothecation mapping
    agreement_number: Mapped[str] = mapped_column(String(100), nullable=True) # deal_agreement
    kyc_status: Mapped[str] = mapped_column(String(50), nullable=True) # kyc

    documents = relationship("VehicleDocument", backref="vehicle", cascade="all, delete-orphan")

    def to_dict(self):
        d = {}
        for c in self.__table__.columns:
            val = getattr(self, c.name)
            if isinstance(val, (datetime, date)): # Handle types manually if needed, but datetime covers it for json serializable usually requires str
                val = str(val)
            d[c.name] = val
        return d

class VehicleDocument(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(Integer, ForeignKey('vehicle.id'), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50))
    file_path: Mapped[str] = mapped_column(String(255))

class FinanceRecord(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    bank_name: Mapped[str] = mapped_column(String(100), nullable=True)
    bank_branch: Mapped[str] = mapped_column(String(100), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=True)
    account_number: Mapped[str] = mapped_column(String(50), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    
    starting_date: Mapped[date] = mapped_column(Date, nullable=True)
    ending_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    loan_protection: Mapped[bool] = mapped_column(Boolean, default=False)
    disbursement_amount: Mapped[float] = mapped_column(Float, default=0.0)
    disbursement_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default='Pending')
    emi_amount: Mapped[float] = mapped_column(Float, default=0.0)
    
    vehicle_id: Mapped[int] = mapped_column(Integer, ForeignKey('vehicle.id'), nullable=True)
    car_type: Mapped[str] = mapped_column(String(50), nullable=True) # New/Old

    def to_dict(self):
        d = {}
        for c in self.__table__.columns:
            val = getattr(self, c.name)
            if isinstance(val, (datetime, date)):
                val = str(val)
            d[c.name] = val
        return d

class Insurance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bank_name = db.Column(db.String(100))
    branch = db.Column(db.String(100))
    customer_name = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200))
    total_amount = db.Column(db.Float, default=0.0)
    premium_amount = db.Column(db.Float, default=0.0)
    insurance_company = db.Column(db.String(100))
    expiry_date = db.Column(db.String(20)) # Storing as string YYYY-MM-DD
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=True) # Linked to Vehicle
    
    vehicle = db.relationship('Vehicle', backref=db.backref('insurances', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "bank_name": self.bank_name,
            "branch": self.branch,
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "address": self.address,
            "total_amount": self.total_amount,
            "premium_amount": self.premium_amount,
            "insurance_company": self.insurance_company,
            "expiry_date": self.expiry_date,
            "vehicle_id": self.vehicle_id,
            "vehicle": self.vehicle.to_dict() if self.vehicle else None
        }

# ----------------- API ENDPOINTS -----------------

@app.route('/')
def index():
    return "Lyrcon API Backend is Running. Use /api/ endpoints."

def create_vehicle():
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            files = request.files
        else:
            data = request.get_json()
            files = {}

        print(f"DEBUG: POST create_vehicle. Type: {data.get('transaction_type')}, Manufacturer: {data.get('manufacturer')}")
        
        new_vehicle = Vehicle(
            transaction_type=data.get('transaction_type'),
            docket_number=data.get('docket_number'),
            manufacturer=data.get('manufacturer'),
            model=data.get('model'),
            year=int(data.get('year')) if data.get('year') else None,
            color=data.get('color'),
            fuel_type=data.get('fuel_type'),
            chassis_number=data.get('vin') or data.get('chassis_number'),
            engine_number=data.get('engine_number'),
            registration_number=data.get('registration_number'),
            running_km=float(data.get('running_km', 0)) if data.get('running_km') else 0.0,
            rto_passing_status=data.get('rto_passing_status'),
            plate_type=data.get('plate_type'),
            executive_name=data.get('executive_name'),
            insurance_company=data.get('insurance_company'),
            
            buyer_name=data.get('buyer_name'),
            buyer_email=data.get('buyer_email'),
            buyer_address=data.get('buyer_address'),
            price=float(data.get('price', 0)) if data.get('price') else 0.0,
            
            status='Available' if data.get('transaction_type') != 'Sale' else 'Sold',
            
            # New Fields
            entry_type=data.get('entry_type'),
            customer_name=data.get('customer_name'),
            customer_phone=data.get('customer_phone'),
            customer_email=data.get('customer_email'),
            dealer=data.get('dealer'),
            location=data.get('location'),
            choice_number=data.get('choice_number'),
            insurance_expiry=data.get('insurance_expiry'),
            scheme=data.get('scheme'),
            other_remarks=data.get('other_remarks'),
            hp=data.get('hp') or data.get('hp_name'),
            nominee_name=data.get('nominee_name'),
            nominee_relation=data.get('nominee_relation'),
            broker_name=data.get('broker_name'),
            broker_number=data.get('broker_number'),
            brokerage_amount=float(data.get('brokerage_amount', 0)) if data.get('brokerage_amount') else 0.0,
            city=data.get('customer_city'),
            pincode=data.get('customer_pincode'),
            address_line_1=data.get('customer_address_line1'),
            address_line_2=data.get('customer_address_line2')
        )
        
        # Handle Dates
        def parse_date(d_str):
            if d_str: 
                try: return datetime.strptime(d_str, '%Y-%m-%d')
                except: return None
            return None

        if data.get('delivery_date'): new_vehicle.delivery_date = parse_date(data.get('delivery_date'))
        if data.get('booking_date'): new_vehicle.booking_date = parse_date(data.get('booking_date'))
        if data.get('customer_dob'): new_vehicle.customer_dob = parse_date(data.get('customer_dob'))
        if data.get('nominee_dob'): new_vehicle.nominee_dob = parse_date(data.get('nominee_dob'))
        if data.get('buyer_dob'): new_vehicle.buyer_dob = parse_date(data.get('buyer_dob'))

        # Check VIN uniqueness
        if new_vehicle.chassis_number:
            existing = db.session.execute(db.select(Vehicle).filter_by(chassis_number=new_vehicle.chassis_number)).scalar_one_or_none()
            if existing:
                 return jsonify({"success": False, "message": f"VIN {new_vehicle.chassis_number} already exists"}), 400

        db.session.add(new_vehicle)
        db.session.flush() # Generate ID for foreign key usage

        # Handle File Uploads
        for key, file in files.items():
            if file and file.filename:
                safe_filename = secure_filename(f"{new_vehicle.id}_{key}_{file.filename}")
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
                file.save(save_path)

                new_doc = VehicleDocument(
                    vehicle_id=new_vehicle.id,
                    doc_type=key,
                    file_path=safe_filename
                )
                db.session.add(new_doc)

        db.session.commit()
        return jsonify({
            "success": True, 
            "message": "Vehicle created successfully", 
            "id": new_vehicle.id,
            "vehicle": new_vehicle.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error in create_vehicle: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/decode-vin/<vin>', methods=['GET'])
def decode_vin(vin):
    """
    Decode VIN using NHTSA vPIC API
    Returns: Make, Model, ModelYear, FuelTypePrimary
    """
    try:
        # NHTSA vPIC API endpoint
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        results = data.get('Results', [])
        
        # Extract relevant fields
        vehicle_data = {}
        for item in results:
            variable = item.get('Variable', '')
            value = item.get('Value', '')
            
            if variable == 'Make' and value:
                vehicle_data['Make'] = value
            elif variable == 'Model' and value:
                vehicle_data['Model'] = value
            elif variable == 'Model Year' and value:
                vehicle_data['ModelYear'] = value
            elif variable == 'Fuel Type - Primary' and value:
                vehicle_data['FuelTypePrimary'] = value
        
        if not vehicle_data:
            return jsonify({"error": "Could not decode VIN. Please check the VIN number."}), 400
        
        return jsonify(vehicle_data), 200
        
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timeout. Please try again."}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch VIN data: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/vehicles', methods=['GET', 'POST'])
def vehicles_handler():
    if request.method == 'GET':
        # Fetch all vehicles (or filter by type if needed later)
        vehicles = db.session.execute(db.select(Vehicle).order_by(Vehicle.id.desc())).scalars().all()
        return jsonify([v.to_dict() for v in vehicles]), 200

    if request.method == 'POST':
        return create_vehicle()

@app.route('/api/vehicles/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def single_vehicle_handler(id):
    vehicle = db.session.get(Vehicle, id)
    if not vehicle:
        return jsonify({"success": False, "message": "Vehicle not found"}), 404

    if request.method == 'GET':
        return jsonify(vehicle.to_dict()), 200

    if request.method == 'DELETE':
        try:
            db.session.delete(vehicle)
            db.session.commit()
            return jsonify({"success": True, "message": "Vehicle deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": str(e)}), 500

    if request.method == 'PUT':
        try:
            print(f"DEBUG: Starting PUT request for vehicle {id}")
            
            # Handle Updates (JSON or Multipart)
            if request.content_type and 'multipart/form-data' in request.content_type:
                data = request.form.to_dict()
                files = request.files
            else:
                data = request.get_json()
                files = {}
            
            print(f"DEBUG: PUT vehicle {id} keys: {list(data.keys())}")
            if 'dealer_payment_history' in data:
                print(f"DEBUG: History len: {len(data['dealer_payment_history'])}")
                print(f"DEBUG: History snippet: {data['dealer_payment_history'][:50]}")

            for key, value in data.items():
                # Robust field mapping for frontend/backend differences
                target_key = key
                if key == 'vin': target_key = 'chassis_number'
                elif key == 'customer_city': target_key = 'city'
                elif key == 'customer_pincode': target_key = 'pincode'
                elif key == 'customer_address_line1': target_key = 'address_line_1'
                elif key == 'customer_address_line2': target_key = 'address_line_2'
                
                if hasattr(vehicle, target_key):
                    if value == '' or value is None:
                        # For running_km, use 0.0 instead of None due to NOT NULL constraint
                        if target_key == 'running_km':
                            setattr(vehicle, target_key, 0.0)
                        else:
                            setattr(vehicle, target_key, None)
                    else:
                        # Attempt numeric conversion for specific fields
                        if target_key in ['price', 'running_km', 'brokerage_amount', 'year', 'customer_remaining_amount', 'net_short_amount']:
                            try:
                                if target_key == 'year': 
                                    setattr(vehicle, target_key, int(value))
                                else: 
                                    setattr(vehicle, target_key, float(value))
                            except ValueError:
                                # Start of robust error handling for numeric conversions
                                print(f"Warning: Could not convert {key}={value} to number. Setting to None or 0.")
                                if target_key == 'year': 
                                    setattr(vehicle, target_key, None)
                                elif target_key == 'running_km':
                                    setattr(vehicle, target_key, 0.0)  # NOT NULL constraint
                                else: 
                                    setattr(vehicle, target_key, 0.0)
                        else:
                            setattr(vehicle, target_key, value)

                # Handle new JSON fields explicitly if passed as objects (requires json.dumps) or assume passed as strings
                if key in ['dealer_payment_history', 'vehicle_pricing_breakdown', 'dealer_pricing_breakdown']:
                    if isinstance(value, (dict, list)):
                        import json
                        setattr(vehicle, key, json.dumps(value))
                    else:
                        setattr(vehicle, key, value)

            
            # Date Handling - safely parse dates, checking for empty strings and type
            delivery_date = data.get('delivery_date')
            if delivery_date and isinstance(delivery_date, str) and delivery_date.strip():
                try:
                    vehicle.delivery_date = datetime.strptime(delivery_date.strip(), '%Y-%m-%d')
                except ValueError:
                    pass  # Invalid date format, skip
                    
            booking_date = data.get('booking_date')
            if booking_date and isinstance(booking_date, str) and booking_date.strip():
                try:
                    vehicle.booking_date = datetime.strptime(booking_date.strip(), '%Y-%m-%d')
                except ValueError:
                    pass
                    
            customer_dob = data.get('customer_dob')
            if customer_dob and isinstance(customer_dob, str) and customer_dob.strip():
                try:
                    vehicle.customer_dob = datetime.strptime(customer_dob.strip(), '%Y-%m-%d')
                except ValueError:
                    pass
                    
            nominee_dob = data.get('nominee_dob')
            if nominee_dob and isinstance(nominee_dob, str) and nominee_dob.strip():
                try:
                    vehicle.nominee_dob = datetime.strptime(nominee_dob.strip(), '%Y-%m-%d')
                except ValueError:
                    pass
                    
            buyer_dob = data.get('buyer_dob')
            if buyer_dob and isinstance(buyer_dob, str) and buyer_dob.strip():
                try:
                    vehicle.buyer_dob = datetime.strptime(buyer_dob.strip(), '%Y-%m-%d')
                except ValueError:
                    pass

            # Auto-update status based on transaction type
            try:
                if data.get('transaction_type') == 'Sale':
                    vehicle.status = 'Sold'
                    print(f"DEBUG: Setting vehicle {id} status to 'Sold'")
                elif data.get('transaction_type') == 'Purchase':
                    vehicle.status = 'Available'
                    print(f"DEBUG: Setting vehicle {id} status to 'Available'")
            except Exception as status_err:
                print(f"Warning: Could not update status: {status_err}")

            print(f"DEBUG: About to commit vehicle {id} with transaction_type={data.get('transaction_type')}")
            db.session.commit()
            print(f"DEBUG: Successfully committed vehicle {id}")
            
            # Safely serialize vehicle to dict
            try:
                vehicle_dict = vehicle.to_dict()
                return jsonify({"success": True, "message": "Vehicle updated successfully", "vehicle": vehicle_dict}), 200
            except Exception as dict_err:
                print(f"Warning: Could not serialize vehicle to dict: {dict_err}")
                return jsonify({"success": True, "message": "Vehicle updated successfully"}), 200
            
        except Exception as e:
            db.session.rollback()
            import traceback
            error_trace = traceback.format_exc()
            print(f"ERROR updating vehicle {id}: {e}")
            print(f"Full traceback:\n{error_trace}")
            # ALWAYS return valid JSON
            return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()

    if user and user.password == password:
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

@app.route('/api/profile', methods=['GET', 'PUT', 'DELETE'])
def profile_handler():
    # Simplified authentication handling for demo
    email = request.args.get('email')
    if request.method == 'PUT':
        data = request.get_json()
        email = data.get('email')
    elif request.method == 'DELETE':
        email = request.args.get('email')
    
    if not email:
        return jsonify({"message": "Email identifier required"}), 400

    user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
    
    if not user:
         return jsonify({"message": "User not found"}), 404

    if request.method == 'GET':
        return jsonify(user.to_dict()), 200

    if request.method == 'PUT':
        data = request.get_json()
        user.name = data.get('name', user.name)
        user.phone = data.get('phone', user.phone)
        user.location = data.get('location', user.location)
        db.session.commit()
        return jsonify({"success": True, "user": user.to_dict()}), 200

    if request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return jsonify({"success": True, "message": "Account deleted successfully"}), 200

@app.route('/api/change-password', methods=['PUT'])
def change_password():
    data = request.get_json()
    email = data.get('email')
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    if not email or not current_password or not new_password:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if user.password != current_password:
        return jsonify({"success": False, "message": "Incorrect current password"}), 401

    user.password = new_password
    db.session.commit()
    
    return jsonify({"success": True, "message": "Password updated successfully"}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    return jsonify({"success": True, "message": "Logged out successfully"}), 200

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"message": "Email is required"}), 400
        
    user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
    
    if user:
        print(f"--------------------------------------------------")
        print(f" [SIMULATION] SENDING PASSWORD RESET EMAIL TO: {email}")
        print(f"--------------------------------------------------")
    else:
        print(f" [SIMULATION] Password reset requested for non-existent email: {email}")

@app.route('/api/users', methods=['GET', 'POST'])
def manage_users():
    if request.method == 'GET':
        users = db.session.execute(db.select(User).order_by(User.id.desc())).scalars().all()
        return jsonify([u.to_dict() for u in users]), 200

    if request.method == 'POST':
        data = request.get_json()
        try:
            # Basic validation
            if not data.get('email') or not data.get('password'):
                 return jsonify({"success": False, "message": "Email and Password are required"}), 400
            
            # Check exist
            existing = db.session.execute(db.select(User).filter_by(email=data.get('email'))).scalar_one_or_none()
            if existing:
                return jsonify({"success": False, "message": "Email already exists"}), 400

            new_user = User(
                name=data.get('name'),
                email=data.get('email'),
                password=data.get('password'), # In prod, hash this!
                role=data.get('role', 'User'),
                phone=data.get('phone'),
                location=data.get('location')
            )
            db.session.add(new_user)
            db.session.commit()
            return jsonify({"success": True, "message": "User created successfully", "user": new_user.to_dict()}), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/users/<int:id>', methods=['GET', 'DELETE', 'PUT'])
def manage_single_user(id):
    user = db.session.get(User, id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if request.method == 'GET':
        return jsonify(user.to_dict()), 200

    if request.method == 'DELETE':
        try:
            db.session.delete(user)
            db.session.commit()
            return jsonify({"success": True, "message": "User deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": str(e)}), 500

    if request.method == 'PUT':
        # Optional: Allow admin to update other users
        try:
            data = request.get_json()
            if 'name' in data: user.name = data['name']
            if 'email' in data: user.email = data['email']
            if 'role' in data: user.role = data['role']
            # Password update if provided
            if 'password' in data and data['password']: user.password = data['password']
            
            db.session.commit()
            return jsonify({"success": True, "message": "User updated", "user": user.to_dict()}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": str(e)}), 500

def decode_vin(vin):
    try:
        # NHTSA vPIC API
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}?format=json"
        response = requests.get(url)
        
        if response.status_code != 200:
             return jsonify({"success": False, "message": "Failed to connect to NHTSA API"}), 502

        data = response.json()
        results = data.get('Results', [])
        
        if not results:
            return jsonify({"success": False, "message": "No data found for this VIN"}), 404

        vehicle_data = results[0]
        
        # Check for error code in response (NHTSA returns success even for bad VINs sometimes, with error text)
        err_code = vehicle_data.get('ErrorCode')
        if err_code and err_code != "0":
             err_text = vehicle_data.get('ErrorText', 'Unknown VIN Error')
             # Some "errors" are just warnings, but usually non-0 is bad
             # We will return what we found but with a warning if needed, OR just return extracted data 
             # Let's extract what we can.
        
        extracted = {
            "manufacturer": vehicle_data.get('Make', ''),
            "model": vehicle_data.get('Model', ''),
            "year": vehicle_data.get('ModelYear', ''),
            "fuel_type": vehicle_data.get('FuelTypePrimary', ''),
            # "engine_disp": vehicle_data.get('DisplacementL', '') # Optional extra
        }
        
        return jsonify({"success": True, "data": extracted}), 200

    except Exception as e:
        print(f"Error decoding VIN: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# ----------------- FINANCE ENDPOINTS -----------------

@app.route('/api/finances', methods=['GET', 'POST'])
def finances_handler():
    if request.method == 'GET':
        records = db.session.execute(db.select(FinanceRecord).order_by(FinanceRecord.id.desc())).scalars().all()
        return jsonify([r.to_dict() for r in records]), 200

    if request.method == 'POST':
        try:
            data = request.get_json()
            new_record = FinanceRecord(
                bank_name=data.get('bank_name'),
                bank_branch=data.get('bank_branch'),
                customer_name=data.get('customer_name'),
                account_number=data.get('account_number'),
                address=data.get('address'),
                contact_number=data.get('contact_number'),
                email=data.get('email'),
                amount=float(data.get('amount', 0)),
                loan_protection=data.get('loan_protection', False),
                disbursement_amount=float(data.get('disbursement_amount', 0)),
                status='Pending',
                emi_amount=float(data.get('emi_amount', 0)),
                vehicle_id=data.get('vehicle_id'),
                car_type=data.get('car_type')
            )
            
            # Helper for dates
            def parse_date(d_str):
                if d_str: return datetime.strptime(d_str, '%Y-%m-%d').date()
                return None

            new_record.starting_date = parse_date(data.get('starting_date'))
            new_record.ending_date = parse_date(data.get('ending_date'))
            new_record.disbursement_date = parse_date(data.get('disbursement_date'))

            db.session.add(new_record)
            db.session.commit()
            return jsonify({"success": True, "message": "Finance Record Created", "id": new_record.id}), 201
        except Exception as e:
            db.session.rollback()
            print(f"Error creating finance: {e}")
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/finances/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def single_finance_handler(id):
    record = db.session.get(FinanceRecord, id)
    if not record:
        return jsonify({"success": False, "message": "Record not found"}), 404

    if request.method == 'GET':
        return jsonify(record.to_dict()), 200

    if request.method == 'DELETE':
        try:
            db.session.delete(record)
            db.session.commit()
            return jsonify({"success": True, "message": "Record deleted"}), 200
        except Exception as e:
             db.session.rollback()
             return jsonify({"success": False, "message": str(e)}), 500

    if request.method == 'PUT':
        try:
            data = request.get_json()
            for key, value in data.items():
                if hasattr(record, key) and key != 'id':
                    if key in ['starting_date', 'ending_date', 'disbursement_date'] and value:
                         setattr(record, key, datetime.strptime(value, '%Y-%m-%d').date())
                    elif key in ['amount', 'disbursement_amount', 'emi_amount']:
                         setattr(record, key, float(value))
                    else:
                         setattr(record, key, value)
            
            db.session.commit()
            return jsonify({"success": True, "message": "Record updated"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/insurances', methods=['GET', 'POST'])
def insurances_handler():
    # Helper to clean currency strings to float
    def parse_float(val):
        if isinstance(val, (int, float)): return val
        if not val: return 0.0
        return float(str(val).replace('$', '').replace(',', ''))

    if request.method == 'GET':
        insurances = Insurance.query.order_by(Insurance.id.desc()).all()
        return jsonify([i.to_dict() for i in insurances]), 200

    if request.method == 'POST':
        data = request.get_json()
        try:
            new_insurance = Insurance(
                bank_name=data.get('bank_name', ''),
                branch=data.get('branch', ''),
                customer_name=data.get('customer_name'),
                customer_phone=data.get('customer_phone'),
                address=data.get('address', ''),
                total_amount=parse_float(data.get('total_amount')),
                premium_amount=parse_float(data.get('premium_amount')),
                insurance_company=data.get('insurance_company', ''),
                expiry_date=data.get('expiry_date', ''),
                vehicle_id=data.get('vehicle_id')
            )
            db.session.add(new_insurance)
            db.session.commit()
            return jsonify({"success": True, "insurance": new_insurance.to_dict()}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

@app.route('/api/insurances/<int:id>', methods=['DELETE'])
def delete_insurance(id):
    insurance = Insurance.query.get(id)
    if not insurance:
        return jsonify({"error": "Insurance record not found"}), 404
    
    try:
        db.session.delete(insurance)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    try:
        # 1. Basic Stats
        sold_vehicles = db.session.execute(db.select(Vehicle).filter_by(status='Sold')).scalars().all()
        finance_records = db.session.execute(db.select(FinanceRecord)).scalars().all() # Count all for now

        total_revenue = sum(v.price for v in sold_vehicles if v.price)
        cars_sold = len(sold_vehicles)
        loans_approved = len(finance_records) # refined logic could check status='Approved'

        # 2. Prepare Data for AI Forecasting (Group by Month)
        # Format: [{'name': 'Jan', 'sales': 1000}, ...]
        sales_by_month = {}
        for v in sold_vehicles:
            if v.delivery_date:
                month_key = v.delivery_date.strftime('%b') # Jan, Feb...
                # Simple aggregation (summing price)
                sales_by_month[month_key] = sales_by_month.get(month_key, 0) + (v.price or 0)
        
        # Ensure strict order for months
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        current_month_index = datetime.now().month - 1
        
        # Build historic data list
        historic_data = []
        x_values = [] # For regression
        y_values = []
        
        for i, month in enumerate(month_order):
            revenue = sales_by_month.get(month, 0)
            historic_data.append({
                "name": month,
                "sales": revenue,
                "prediction": 0 # updated below
            })
            if revenue > 0:
                x_values.append(i)
                y_values.append(revenue)

        # 3. "AI" Linear Regression (Simple Least Squares)
        # y = mx + c
        prediction_data = historic_data.copy()
        
        if len(x_values) > 1:
            n = len(x_values)
            sum_x = sum(x_values)
            sum_y = sum(y_values)
            sum_xy = sum(x*y for x,y in zip(x_values, y_values))
            sum_xx = sum(x*x for x in x_values)
            
            # Handling zero division if all x are same (unlikely with >1 points)
            try:
                slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x ** 2)
                intercept = (sum_y - slope * sum_x) / n
                
                # Apply prediction to next 3 months
                for i in range(12):
                    # Only predict for future months or current (simplified)
                    # We'll just populate the 'prediction' key for all for the chart effect
                    # But typically we want to show it extending future.
                    # For this chart, let's overlap them.
                    pred_value = slope * i + intercept
                    prediction_data[i]['prediction'] = max(0, round(pred_value, 2))
                    
            except ZeroDivisionError:
                pass 

        return jsonify({
            "stats": {
                "revenue": total_revenue,
                "carsSold": cars_sold,
                "loansApproved": loans_approved
            },
            "salesData": prediction_data,
            "upcomingInsurances": [
                {
                    "car_id": i.vehicle.id if i.vehicle else "N/A",
                    "car_name": f"{i.vehicle.make} {i.vehicle.model}" if i.vehicle and hasattr(i.vehicle, 'make') else (f"{i.vehicle.manufacturer} {i.vehicle.model}" if i.vehicle else "Unknown Car"),
                    "expiry_date": i.expiry_date,
                    "status": "Expiring Soon" if (datetime.strptime(i.expiry_date, '%Y-%m-%d') - datetime.now()).days <= 30 else "Active"
                }
                for i in db.session.execute(
                    db.select(Insurance)
                    .filter(Insurance.expiry_date >= date.today().strftime('%Y-%m-%d'))
                    .order_by(Insurance.expiry_date.asc())
                    .limit(5)
                ).scalars().all()
                if i.expiry_date # Ensure expiry_date is not null
            ]
        }), 200

    except Exception as e:
        print(f"Error in dashboard stats: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

def seed_admin_user():
    try:
        admin_email = "admin@lyrcon.com"
        # Check if admin exists
        admin = db.session.execute(db.select(User).filter_by(email=admin_email)).scalar_one_or_none()
        if not admin:
            print(f"[-] Admin user {admin_email} not found. Seeding...")
            new_admin = User(
                name="Admin User",
                email=admin_email,
                password="password123", # Default password
                role="Manager",
                phone="9876543210",
                location="Headquarters, NY"
            )
            db.session.add(new_admin)
            db.session.commit()
            print(f"[+] Admin user seeded successfully.")
    except Exception as e:
        print(f"[!] Failed to seed admin user: {e}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_admin_user()
    app.run(debug=True, port=5000)
