# Step 1: Stop and remove everything from PM2
pm2 delete all
pm2 kill

# Step 2: Clean up old virtual environments
cd /home/ubuntu/LyrconDemoCar
rm -rf venv
cd backend
rm -rf venv

# Step 3: Create a fresh virtual environment
cd /home/ubuntu/LyrconDemoCar/backend
python3 -m venv venv
source venv/bin/activate

# Step 4: Install ONLY the essential packages first
pip install --upgrade pip
pip install Flask==3.0.0
pip install Flask-CORS==4.0.0
pip install psycopg2-binary==2.9.9
pip install SQLAlchemy==2.0.23
pip install Flask-SQLAlchemy==3.1.1
pip install bcrypt==4.1.2

# Verify bcrypt is installed
python -c "import bcrypt; print('✓ bcrypt works')"

deactivate

# Step 5: Reset PostgreSQL password to 'root'
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS LyrconCar;
DROP USER IF EXISTS lyrcon_user;
CREATE USER lyrcon_user WITH PASSWORD 'root';
CREATE DATABASE LyrconCar OWNER lyrcon_user;
GRANT ALL PRIVILEGES ON DATABASE LyrconCar TO lyrcon_user;
\q
EOF

# Step 6: Test database connection
PGPASSWORD='root' psql -U lyrcon_user -d LyrconCar -h localhost -c "SELECT 'Database works!' as status;"

# Step 7: Create a simple PM2 config
cd /home/ubuntu/LyrconDemoCar
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
    apps: [
        {
            name: 'lyrcon-backend',
            cwd: '/home/ubuntu/LyrconDemoCar/backend',
            script: 'venv/bin/python',
            args: 'app.py',
            interpreter: 'none',
            env: {
                FLASK_ENV: 'production',
                FLASK_APP: 'app.py',
                PYTHONUNBUFFERED: '1',
                DATABASE_URL: 'postgresql://lyrcon_user:root@localhost/LyrconCar'
            },
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            time: true
        },
        {
            name: 'lyrcon-frontend',
            cwd: '/home/ubuntu/LyrconDemoCar',
            script: 'npm',
            args: 'run preview -- --host 0.0.0.0 --port 5173',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            time: true
        }
    ]
};
EOF

# Step 8: Create logs directory
mkdir -p logs

# Step 9: Initialize the database tables
cd backend
source venv/bin/activate
python << 'PYEOF'
from app import app, db
with app.app_context():
    db.create_all()
    print("✓ Database tables created!")
PYEOF
deactivate

# Step 10: Start everything
cd /home/ubuntu/LyrconDemoCar
pm2 start ecosystem.config.cjs
pm2 save

# Step 11: Check status
pm2 status
pm2 logs --lines 50