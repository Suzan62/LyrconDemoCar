
import re

sql_file_path = "c:\\Users\\DELL\\.gemini\\antigravity\\scratch\\lyrcon-replica\\parivar_postgres_compatible (7).sql"

def extract_tables():
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find CREATE TABLE "table_name"
    matches = re.findall(r'CREATE TABLE "(\w+)" \((.*?)\);', content, re.DOTALL)
    
    target_tables = [
        "executives", "executive_branches", "manufacturers", "models", 
        "rto", "rto_codes", "insurance_companies"
    ]
    
    for match in matches:
        table_name = match[0]
        if table_name not in target_tables: continue
        
        columns_block = match[1]
        print(f"Table: {table_name}")
        
        # Simple line split might work for these simple tables
        lines = columns_block.split(',')
        for line in lines:
            print(f"  {line.strip()}")
        print("-" * 20)

extract_tables()
