#!/bin/bash

# Quick deployment script for updates
# Run this after making code changes

set -e

echo "🔄 Deploying updates..."

# Pull latest code
echo "Pulling latest code from Git..."
git pull origin main

# Update backend
echo "Updating backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate
cd ..

# Update frontend
echo "Updating frontend..."
npm install --quiet
npm run build

# Restart services
echo "Restarting services..."
pm2 restart all

echo "✅ Deployment complete!"
echo ""
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs"
