import sys
import os
import re
from datetime import datetime

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db, Vehicle

SQL_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'u134626675_parivar_motors.sql')

def parse_insert_statements_with_columns(sql_content, table_name):
    """
    Finds insert statements, parses column names, and returns (columns, rows).
    """
    pattern = re.compile(f"INSERT INTO `{table_name}`\s*\((.*?)\)\s*VALUES\s*(.*?;)", re.DOTALL | re.IGNORECASE)
    matches = pattern.findall(sql_content)
    
    all_rows = []
    columns = []
    
    for cols_str, values_part in matches:
        # Parse columns
        # cols_str looks like "`id`, `docket_number`, ..."
        columns = [c.strip().strip('`') for c in cols_str.split(',')]
        
        # Parse values
        # Naive parsing of values part
        # We'll use the same logic as before but be careful
        rows = []
        buffer = ""
        in_string = False
        depth = 0
        
        # Cleanup VALUES header if captured in group 2 (regex dependent)
        # Actually my regex captures VALUES ... ;
        # So values_part starts with ( or spaces
        
        for char in values_part:
            if char == "'" and (len(buffer) == 0 or buffer[-1] != '\\'):
                in_string = not in_string
            
            if not in_string:
                if char == '(':
                    depth += 1
                    if depth == 1:
                        buffer = ""
                        continue
                elif char == ')':
                    depth -= 1
                    if depth == 0:
                        rows.append(buffer)
                        buffer = ""
                        continue
            
            if depth > 0:
                buffer += char
        
        parsed_rows = []
        for r in rows:
            cols = []
            col_buff = ""
            in_col_str = False
            for c in r:
                if c == "'" and (len(col_buff)==0 or col_buff[-1]!='\\'):
                    in_col_str = not in_col_str
                    continue # Strip quotes
                if c == ',' and not in_col_str:
                    cols.append(col_buff.strip())
                    col_buff = ""
                else:
                    col_buff += c
            cols.append(col_buff.strip())
            
            clean_cols = []
            for c in cols:
                if c == 'NULL': clean_cols.append(None)
                else: clean_cols.append(c)
            parsed_rows.append(clean_cols)
            
        all_rows.extend(parsed_rows)
        
    return columns, all_rows

def map_row_to_vehicle(row, columns, transaction_type):
    data = dict(zip(columns, row))
    
    def get(k): return data.get(k)
    def get_float(k): 
        try: return float(get(k)) if get(k) else 0.0
        except: return 0.0
    def get_date(k):
        v = get(k)
        if v and len(v) >= 10:
            try: return datetime.strptime(v[:10], '%Y-%m-%d')
            except: pass
        return None

    # Common fields mapping
    v = Vehicle(
        transaction_type=transaction_type,
        
        # Identity
        manufacturer=get('manufacturer_name') or get('company_name'), # old_cars uses company_name
        model=get('model_name') or get('model_variant'), # old_cars uses model_variant or model
        color=get('color'),
        year=int(get('manufacture_year')) if get('manufacture_year') and get('manufacture_year').isdigit() else (int(get('model_year')) if get('model_year') and get('model_year').isdigit() else None),
        fuel_type=get('fuel_type'),
        running_km=get_float('running_kilometer') or get_float('kilometer'),
        registration_number=get('registration_no') or get('car_no'), # old_cars uses car_no
        chassis_number=get('chassis_no') if get('chassis_no') else None, # Force None if empty
        engine_number=get('engine_no'),
        
        # Customer
        customer_name=get('customer_name') or get('party_name'), # old_cars uses party_name
        customer_phone=get('customer_phone') or get('contact_no'),
        address_line_1=get('customer_address1') or get('address'),
        address_line_2=get('customer_address2'),
        city=get('city_name') or get('city'),
        pincode=get('pincode'),
        customer_email=get('email'),
        customer_dob=get_date('customer_dob'),
        
        # Dates
        booking_date=get_date('booking_date'),
        delivery_date=get_date('delivery_date'),
        
        # Pricing
        price=get_float('ex_showroom_price') or get_float('final_price') or get_float('purchase_price'),
        
        # New Car Specifics
        docket_number=get('docket_number'),
        dealer=get('dealer_name'),
        executive_name=get('executive_name'),
        executive_branch=get('executive_branch_name'),
        insurance_company=get('insurance_company_name'),
        hp=get('hp_name'),
        nominee_name=get('nominee_name'),
        nominee_relation=get('nominee_relationship'),
        kyc_status=get('kyc'),
        agreement_number=get('deal_agreement'),
        rto_tax=get_float('rto_tax'),
        insurance_amount=get_float('insurance'),
        accessories_amount=get_float('accessories'),
        krunal_accessories=get_float('krunal_accessories'),
        
        status='Available' if transaction_type != 'Sale' else 'Sold'
    )
    
    # Old Car (Purchase) Specifics
    if transaction_type == 'Purchase':
        v.buyer_name = get('party_name') # Seller in this context
        v.price = get_float('purchase_price')
        
    return v

from sqlalchemy.exc import IntegrityError
from app import app, db, Vehicle, VehicleDocument, FinanceRecord, Insurance

# ... (rest of imports)

def import_data():
    with app.app_context():
        print("Reading SQL file...")
        try:
            with open(SQL_FILE_PATH, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"File not found: {SQL_FILE_PATH}")
            return

        print("Recreating database schema...")
        # Drop all to ensure schema updates (add new columns) are applied
        db.drop_all()
        db.create_all()
        
        # Optional: Re-create dummy admin user if needed, or let user recreate it
        # Just creating tables is enough for import.
        
        tables_map = [
            ('new_cars', 'New'),
            ('old_cars', 'Purchase'),
            ('old_cars_sell', 'Sale')
        ]
        
        for table, type_ in tables_map:
            print(f"Importing {table} as {type_}...")
            cols, rows = parse_insert_statements_with_columns(content, table)
            print(f"  Found {len(rows)} rows with columns: {cols}")
            
            count = 0
            skipped = 0
            for row in rows:
                if len(row) != len(cols):
                    skipped += 1
                    continue
                try:
                    v = map_row_to_vehicle(row, cols, type_)
                    db.session.add(v)
                    db.session.commit()
                    count += 1
                except IntegrityError as e:
                    db.session.rollback()
                    # print(f"  IntegrityError (duplicate/constraint violation): {e}")
                    skipped += 1
                except Exception as e:
                    db.session.rollback()
                    # print(f"  Error mapping/inserting row: {e}")
                    skipped += 1
                    
            print(f"  Added {count} records. Skipped {skipped}.")
        
        print("Migration complete!")

if __name__ == "__main__":
    import_data()
