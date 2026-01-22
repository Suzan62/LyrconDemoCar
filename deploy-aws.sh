#!/bin/bash

# Lyrcon Replica - AWS EC2 Deployment Script
# Run this script on your EC2 instance after cloning the repository

set -e  # Exit on error

echo "🚀 Starting Lyrcon Replica Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$ACTUAL_USER)

print_status "Deploying as user: $ACTUAL_USER"
print_status "Home directory: $USER_HOME"

# 1. Update System
print_status "Step 1/8: Updating system packages..."
apt update && apt upgrade -y

# 2. Install Node.js 18.x
print_status "Step 2/8: Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_status "Node.js installed: $(node --version)"
else
    print_status "Node.js already installed: $(node --version)"
fi

# 3. Install Python and dependencies
print_status "Step 3/8: Installing Python and dependencies..."
apt install -y python3 python3-pip python3-venv python3-dev libpq-dev

# 4. Install PostgreSQL
print_status "Step 4/8: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    print_status "PostgreSQL installed and started"
else
    print_status "PostgreSQL already installed"
fi

# 5. Install Nginx
print_status "Step 5/8: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_status "Nginx installed and started"
else
    print_status "Nginx already installed"
fi

# 6. Install PM2
print_status "Step 6/8: Installing PM2..."
npm install -g pm2
print_status "PM2 installed: $(pm2 --version)"

# 7. Setup PostgreSQL Database
print_status "Step 7/8: Setting up PostgreSQL database..."

# Prompt for database password
read -sp "Enter password for database user 'lyrcon_user': " DB_PASSWORD
echo

# Create database and user
sudo -u postgres psql <<EOF
-- Create database
CREATE DATABASE LyrconCar;

-- Create user
CREATE USER lyrcon_user WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE LyrconCar TO lyrcon_user;

-- Grant schema privileges
\c LyrconCar
GRANT ALL ON SCHEMA public TO lyrcon_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lyrcon_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lyrcon_user;
EOF

print_status "Database created successfully"

# 8. Setup Application
print_status "Step 8/8: Setting up application..."

# Navigate to project directory
cd $USER_HOME/lyrcon-replica

# Backend setup
print_status "Setting up backend..."
cd backend

# Create virtual environment
sudo -u $ACTUAL_USER python3 -m venv venv

# Activate and install dependencies
sudo -u $ACTUAL_USER bash -c "source venv/bin/activate && pip install -r requirements.txt"

# Create .env file
cat > .env <<EOF
DATABASE_URL=postgresql://lyrcon_user:$DB_PASSWORD@localhost/LyrconCar
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
FLASK_ENV=production
EOF

chown $ACTUAL_USER:$ACTUAL_USER .env
chmod 600 .env

print_status "Backend configured"

# Import database schema
print_status "Importing database schema..."
cd ..
if [ -f "parivar_postgres_compatible (7).sql" ]; then
    sudo -u postgres psql -d LyrconCar -f "parivar_postgres_compatible (7).sql"
    print_status "Database schema imported"
else
    print_warning "SQL file not found. You'll need to import it manually."
fi

# Frontend setup
print_status "Setting up frontend..."
sudo -u $ACTUAL_USER npm install
sudo -u $ACTUAL_USER npm run build

# Create logs directory
mkdir -p $USER_HOME/logs
chown $ACTUAL_USER:$ACTUAL_USER $USER_HOME/logs

# Update ecosystem.config.js with actual paths
sed -i "s|/home/ubuntu|$USER_HOME|g" ecosystem.config.js
sed -i "s|your_secure_password|$DB_PASSWORD|g" ecosystem.config.js

# Start applications with PM2
print_status "Starting applications with PM2..."
sudo -u $ACTUAL_USER pm2 start ecosystem.config.js
sudo -u $ACTUAL_USER pm2 save

# Setup PM2 to start on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u $ACTUAL_USER --hp $USER_HOME

# Configure Nginx
print_status "Configuring Nginx..."

# Get EC2 public IP or use localhost
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "localhost")

cat > /etc/nginx/sites-available/lyrcon <<EOF
server {
    listen 80;
    server_name $PUBLIC_IP _;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/lyrcon /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t && systemctl restart nginx

print_status "Nginx configured"

# Configure UFW Firewall
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

print_status "Firewall configured"

# Print summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Your application is now running at:"
echo "  http://$PUBLIC_IP"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View application logs"
echo "  pm2 restart all     - Restart all applications"
echo "  sudo systemctl status nginx - Check Nginx status"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@lyrcon.com"
echo "  Password: (check your database or create a new admin user)"
echo ""
print_warning "Remember to:"
print_warning "1. Change default passwords"
print_warning "2. Set up SSL certificate for production"
print_warning "3. Configure regular database backups"
print_warning "4. Monitor application logs"
echo ""
