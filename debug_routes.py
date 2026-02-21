
import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app import app

if __name__ == "__main__":
    with open('routes_full.txt', 'w') as f:
        f.write(str(app.url_map))
