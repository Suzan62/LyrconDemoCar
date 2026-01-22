# Production Setup Guide 🚀

Follow these steps to deploy Lyrcon Replica on a fresh **Ubuntu** EC2 instance.

## 1. System Prerequisites

Run these commands to install Node.js, Python, PostgreSQL, and Nginx:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python & venv
sudo apt install python3-pip python3-venv libpq-dev -y

# Install Node.js (v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

## 2. Configure Database

```bash
# Log into Postgres
sudo -u postgres psql

# Create User and Database (Run these inside the psql prompt)
CREATE DATABASE "LyrconCar";
CREATE USER lyrcon_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE "LyrconCar" TO lyrcon_user;
ALTER USER lyrcon_user WITH SUPERUSER; -- Optional, easier for development
\q
```

## 3. Clone & Setup Project

```bash
# Clone Repository
git clone https://github.com/Suzan62/LyrconDemoCar.git
cd LyrconDemoCar

# --- BACKEND SETUP ---
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Set Environment Variables
export DATABASE_URL="postgresql://lyrcon_user:your_secure_password@localhost/LyrconCar"

# --- IMPORT EXISTING DATA (PARIVAR SQL) ---
# 1. Upload your specific SQL file to the server (Run this in PowerShell on LOCAL machine)
# scp -i "LyrconWeb-Key.pem" "parivar_postgres_compatible (7).sql" ubuntu@YOUR_SERVER_IP:/home/ubuntu/parivar.sql

# 2. Import SQL Dump (Run this on SERVER)
# We rename it to 'parivar.sql' during upload for easier typing
psql -U lyrcon_user -d "LyrconCar" -f /home/ubuntu/parivar.sql

# 3. Create Admin User (Safe script)
python seed_production.py
# (Output should say: ✅ Admin created or already exists)

deactivate
cd ..

# --- FRONTEND SETUP ---
npm install
npm run build
```

## 4. Environment Variables

Create a persistent `.env` file for backend:

```bash
nano backend/.env
```

Paste this content:
```ini
DATABASE_URL=postgresql://lyrcon_user:your_secure_password@localhost/LyrconCar
FLASK_ENV=production
SECRET_KEY=your_super_secret_key_change_this
```

## 5. Start Application with PM2

```bash
# Start Backend and Frontend
pm2 start ecosystem.config.cjs

# Save configuration to auto-start on reboot
pm2 save
pm2 startup
```

## 6. Verification

1.  Open your browser to `http://YOUR_SERVER_IP:5173` (if using default port) or configured domain.
2.  Login with:
    *   **Email:** `admin@lyrcon.com`
    *   **Password:** `password123`
3.  Check Dashboard (Should show 0 stats initially).
4.  Go to **Profile** page to verify data loading.

## Troubleshooting

-   **Database Connection Failed?** Check `DATABASE_URL` in `.env`.
-   **Frontend Error?** Run `pm2 logs`.
-   **CORS Error?** Ensure you pulled the latest code with `vite.config.js` proxy fix.
