# AWS EC2 Deployment - Quick Start Guide

## Prerequisites
- AWS EC2 instance running Ubuntu 20.04 or 22.04
- SSH access to the instance
- Security group configured to allow ports: 22, 80, 443, 5000, 5173

## Step 1: Prepare Your Code

```bash
# On your local machine
cd c:\Users\DELL\.gemini\antigravity\scratch\lyrcon-replica

# Initialize Git repository (if not already done)
git init
git add .
git commit -m "Initial commit for AWS deployment"

# Push to GitHub (create a repository first on GitHub)
git remote add origin https://github.com/yourusername/lyrcon-replica.git
git branch -M main
git push -u origin main
```

## Step 2: Connect to EC2

```bash
# Replace with your key file and EC2 public IP
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

## Step 3: Clone Repository

```bash
# On EC2 instance
cd ~
git clone https://github.com/yourusername/lyrcon-replica.git
cd lyrcon-replica
```

## Step 4: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-aws.sh

# Run deployment (will prompt for database password)
sudo ./deploy-aws.sh
```

The script will:
- ✅ Install all dependencies (Node.js, Python, PostgreSQL, Nginx, PM2)
- ✅ Set up PostgreSQL database
- ✅ Configure backend with virtual environment
- ✅ Build frontend for production
- ✅ Start applications with PM2
- ✅ Configure Nginx as reverse proxy
- ✅ Set up firewall rules

## Step 5: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs

# Check Nginx status
sudo systemctl status nginx

# Test backend API
curl http://localhost:5000/api/vehicles

# Test frontend
curl http://localhost:5173
```

## Step 6: Access Your Application

Open your browser and navigate to:
```
http://your-ec2-public-ip
```

Default login credentials:
- Email: admin@lyrcon.com
- Password: (check your database or create admin user)

## Future Updates

When you make code changes:

```bash
# On your local machine
git add .
git commit -m "Your update message"
git push origin main

# On EC2 instance
cd ~/lyrcon-replica
./update.sh
```

## Troubleshooting

### Application not accessible
```bash
# Check if services are running
pm2 status

# Restart services
pm2 restart all

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Database connection issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql -d LyrconCar
```

### View logs
```bash
# Backend logs
pm2 logs lyrcon-backend

# Frontend logs
pm2 logs lyrcon-frontend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## Security Recommendations

1. **Change default passwords** immediately after deployment
2. **Set up SSL certificate** using Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```
3. **Configure database backups**:
   ```bash
   # Create backup script
   sudo -u postgres pg_dump LyrconCar > backup_$(date +%Y%m%d).sql
   ```
4. **Monitor logs regularly**
5. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Support

For issues or questions:
- Check PM2 logs: `pm2 logs`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Review deployment plan: `implementation_plan.md`
