
import os

def check_schema():
    path = "parivar_postgres_compatible (7).sql"
    if not os.path.exists(path):
        print("File not found")
        return

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    start = content.find('CREATE TABLE "users"')
    if start == -1:
        print("Table 'users' not found")
        return
        
    end = content.find(';', start)
    print(content[start:end+1])

if __name__ == "__main__":
    check_schema()
