import re

sql_file = "parivar_postgres_compatible (7).sql"
tables_to_inspect = ['new_cars', 'old_cars', 'old_cars_sell']

try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
        for table in tables_to_inspect:
            print(f"\n{'='*60}")
            print(f"Schema for {table}")
            print('='*60)
            pattern = re.compile(rf'CREATE TABLE "{table}" \((.*?)\);', re.DOTALL | re.IGNORECASE)
            match = pattern.search(content)
            if match:
                schema = match.group(1)
                # Print first 50 lines to get column overview
                lines = schema.split('\n')[:50]
                print('\n'.join(lines))
            else:
                print(f"Table {table} not found.")

except Exception as e:
    print(f"Error reading file: {e}")
