# Stop PM2 first
pm2 stop all

# Activate venv and install ALL requirements
cd /home/ubuntu/LyrconDemoCar/backend
source venv/bin/activate

# Install from requirements.txt (this will get everything your app needs)
pip install -r requirements.txt

# Verify key imports work
python << 'EOF'
import flask
import bcrypt
import requests
import psycopg2
print("✓ All imports successful!")
EOF

deactivate

# Now restart PM2
cd /home/ubuntu/LyrconDemoCar
pm2 restart all

# Check logs
pm2 logs --lines 30