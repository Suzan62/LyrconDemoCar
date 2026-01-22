import re

sql_file = "parivar_postgres_compatible (7).sql"
try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()
        matches = re.findall(r'CREATE TABLE "?([a-zA-Z0-9_]+)"?', content, re.IGNORECASE)
        print("Tables found:", matches)
except Exception as e:
    print(f"Error reading file: {e}")
