#!/bin/bash

# Lyrcon Replica - Automated Deployment Script
# Usage: sudo ./setup.sh

set -e # Exit on error

echo "--- STARTING SETUP ---"

# 1. Update System
echo "[1/6] Updating System..."
apt update && apt upgrade -y

# 2. Install Dependencies
echo "[2/6] Installing Dependencies..."
apt install -y python3-pip python3-venv python3-dev libpq-dev postgresql postgresql-contrib nginx nodejs npm

# 3. Setup Database
echo "[3/6] Setting up PostgreSQL..."
# Create user and db if they don't exist
sudo -u postgres psql -c "CREATE DATABASE lyrcon;" || echo "Database lyrcon already exists."
sudo -u postgres psql -c "CREATE USER myuser WITH PASSWORD 'mypassword';" || echo "User myuser already exists."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE lyrcon TO myuser;"
sudo -u postgres psql -d lyrcon -c "GRANT ALL ON SCHEMA public TO myuser;"

# 4. Setup Backend
echo "[4/6] Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
deactivate
cd ..

# 5. Build Frontend
echo "[5/6] Building Frontend..."
npm install
npm run build
mkdir -p /var/www/lyrcon
cp -r dist/* /var/www/lyrcon/

# 6. Configure Nginx
echo "[6/6] Configuring Nginx..."
# Create config file
cat > /etc/nginx/sites-available/lyrcon <<EOL
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/lyrcon;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        include proxy_params;
        proxy_pass http://unix:$(pwd)/backend/lyrcon.sock;
    }
}
EOL

# Enable site
ln -sf /etc/nginx/sites-available/lyrcon /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 7. Setup Systemd Service
echo "[7/7] Setting up Systemd Service..."
cat > /etc/systemd/system/lyrcon.service <<EOL
[Unit]
Description=Gunicorn instance to serve Lyrcon
After=network.target

[Service]
User=$SUDO_USER
Group=www-data
WorkingDirectory=$(pwd)/backend
Environment="PATH=$(pwd)/backend/venv/bin"
Environment="DATABASE_URL=postgresql://myuser:mypassword@localhost/lyrcon"
ExecStart=$(pwd)/backend/venv/bin/gunicorn --workers 3 --bind unix:lyrcon.sock -m 007 wsgi:app

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl start lyrcon
systemctl enable lyrcon

echo "--- DEPLOYMENT COMPLETE! ---"
echo "Visit your server IP to see the app."
