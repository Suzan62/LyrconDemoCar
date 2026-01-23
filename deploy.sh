# Complete setup in one go
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx git nodejs npm
sudo npm install -g pm2

sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql << EOF
CREATE USER lyrcon_user WITH PASSWORD 'root';
CREATE DATABASE LyrconCar OWNER lyrcon_user;
GRANT ALL PRIVILEGES ON DATABASE LyrconCar TO lyrcon_user;
\q
EOF

cd /home/ubuntu
git clone https://github.com/Suzan62/LyrconDemoCar.git
cd LyrconDemoCar/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('✓ Done!')"
deactivate

cd /home/ubuntu/LyrconDemoCar
npm install
npm run build

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

echo "✅ Setup complete! Check with: pm2 logs"