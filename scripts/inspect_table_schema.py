import re

sql_file = "parivar_postgres_compatible (7).sql"
tables_to_inspect = ['finances', 'users']

try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
        for table in tables_to_inspect:
            print(f"--- Schema for {table} ---")
            # Regex to find CREATE TABLE block
            # This is a simple regex and might fail if there are nested parenthesis or complex structures, 
            # but usually sufficient for SQL dumps.
            pattern = re.compile(rf'CREATE TABLE "{table}" \((.*?)\);', re.DOTALL | re.IGNORECASE)
            match = pattern.search(content)
            if match:
                print(match.group(1))
            else:
                print(f"Table {table} not found or regex failed.")
            print("\n")

except Exception as e:
    print(f"Error reading file: {e}")
