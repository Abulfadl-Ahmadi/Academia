# Academia Platform - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Academia platform to production, including environment setup, security configurations, and monitoring.

---

## 🏗️ Infrastructure Requirements

### Minimum System Requirements
- **CPU**: 4 cores (8 cores recommended)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 100GB SSD (500GB recommended)
- **Network**: 1Gbps connection
- **OS**: Ubuntu 20.04 LTS or CentOS 8+

### Recommended Cloud Providers
- **AWS**: EC2, RDS, S3, CloudFront
- **DigitalOcean**: Droplets, Managed Databases
- **Google Cloud**: Compute Engine, Cloud SQL
- **Azure**: Virtual Machines, SQL Database

---

## 🔧 Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y python3.11 python3.11-venv python3.11-dev
sudo apt install -y nginx postgresql postgresql-contrib
sudo apt install -y redis-server git curl wget
sudo apt install -y build-essential libssl-dev libffi-dev
sudo apt install -y nodejs npm

# Install Node.js 20.x (required for Vite)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE academia_production;
CREATE USER academia_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE academia_production TO academia_user;
ALTER USER academia_user CREATEDB;
\q
```

### 3. Redis Setup

```bash
# Configure Redis
sudo nano /etc/redis/redis.conf
```

```conf
# Redis configuration for production
bind 127.0.0.1
port 6379
requirepass your_redis_password
maxmemory 256mb
maxmemory-policy allkeys-lru
```

```bash
# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

## 📦 Application Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/academia
sudo chown $USER:$USER /var/www/academia
cd /var/www/academia

# Clone repository
git clone https://github.com/your-org/academia.git .
```

### 2. Backend Setup

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install additional production packages
pip install gunicorn psycopg2-binary
```

### 3. Environment Configuration

```bash
# Create production environment file
nano .env
```

```env
# Production Environment Variables
SECRET_KEY=your-super-secure-secret-key-here-change-this
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your-server-ip
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=academia_production
DB_USER=academia_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://:your_redis_password@localhost:6379/0

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# SMS Configuration (if using SMS)
SMS_API_KEY=your-sms-api-key
SMS_API_URL=https://api.sms.ir/v1/send

# Payment Gateway
ZARINPAL_MERCHANT_ID=your-merchant-id
ZARINPAL_SANDBOX=False

# File Storage (AWS S3 or compatible)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=academia-media
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=your-cdn-domain.com

# Security
SESSION_COOKIE_AGE=1209600
CSRF_COOKIE_AGE=31449600
SECURE_SSL_REDIRECT=True
SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Performance
RATE_LIMIT_ENABLED=True
CACHE_TTL=3600

# Features
ENABLE_AI_FEATURES=True
ENABLE_CHAT_FEATURES=True
ENABLE_LIVE_STREAMING=True
ENABLE_PAYMENT_PROCESSING=True
ENABLE_EMAIL_VERIFICATION=True
ENABLE_SMS_VERIFICATION=True

# VOD Configuration
VOD_API_KEY=your-vod-api-key
VOD_API_URL=https://your-vod-service.com
VOD_ACCESS_KEY=your-vod-access-key
VOD_SECRET_KEY=your-vod-secret-key
VOD_BASE_URL=https://your-vod-service.com

# URLs
BACKEND_BASE_URL=https://api.yourdomain.com
FRONTEND_BASE_URL=https://yourdomain.com
```

### 4. Database Migration

```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Load initial data (if any)
python manage.py loaddata initial_data.json
```

### 5. Frontend Setup

```bash
# Navigate to frontend directory
cd vite-project

# Install dependencies
npm install

# Build for production
npm run build

# Copy build files to nginx directory
sudo cp -r dist/* /var/www/html/
```

---

## 🔒 Security Configuration

### 1. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 2. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Nginx Configuration

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/academia
```

```nginx
# Academia Platform Nginx Configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (React App)
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Admin Panel
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Media Files
    location /media/ {
        alias /var/www/academia/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Static Files
    location /static/ {
        alias /var/www/academia/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File Upload Size
    client_max_body_size 100M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🚀 Process Management

### 1. Gunicorn Configuration

```bash
# Create gunicorn configuration
nano gunicorn.conf.py
```

```python
# Gunicorn Configuration
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
```

### 2. PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'academia-backend',
      script: 'gunicorn',
      args: '--config gunicorn.conf.py api.wsgi:application',
      cwd: '/var/www/academia',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        DJANGO_SETTINGS_MODULE: 'api.settings'
      },
      error_file: '/var/log/pm2/academia-backend-error.log',
      out_file: '/var/log/pm2/academia-backend-out.log',
      log_file: '/var/log/pm2/academia-backend.log',
      time: true
    }
  ]
};
```

### 3. Start Services

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 📊 Monitoring & Logging

### 1. Log Configuration

```bash
# Create log directories
sudo mkdir -p /var/log/academia
sudo chown $USER:$USER /var/log/academia

# Configure log rotation
sudo nano /etc/logrotate.d/academia
```

```
/var/log/academia/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Monitoring Setup

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 install pm2-server-monit
```

### 3. Health Checks

```bash
# Create health check script
nano health_check.sh
```

```bash
#!/bin/bash
# Health Check Script

# Check if services are running
if ! pgrep -f "gunicorn" > /dev/null; then
    echo "ERROR: Gunicorn not running"
    exit 1
fi

if ! pgrep -f "nginx" > /dev/null; then
    echo "ERROR: Nginx not running"
    exit 1
fi

# Check database connection
python manage.py check --deploy

# Check API endpoint
curl -f http://localhost:8000/api/health/ || exit 1

echo "All services healthy"
```

```bash
# Make executable
chmod +x health_check.sh

# Add to crontab
crontab -e
```

```
# Health check every 5 minutes
*/5 * * * * /var/www/academia/health_check.sh
```

---

## 🔄 Backup & Recovery

### 1. Database Backup

```bash
# Create backup script
nano backup_db.sh
```

```bash
#!/bin/bash
# Database Backup Script

BACKUP_DIR="/var/backups/academia"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="academia_production"

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U academia_user $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

### 2. Media Files Backup

```bash
# Create media backup script
nano backup_media.sh
```

```bash
#!/bin/bash
# Media Files Backup Script

BACKUP_DIR="/var/backups/academia/media"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup media files
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /var/www/academia/media/

# Keep only last 30 days
find $BACKUP_DIR -name "media_backup_*.tar.gz" -mtime +30 -delete

echo "Media backup completed: media_backup_$DATE.tar.gz"
```

### 3. Automated Backups

```bash
# Add to crontab
crontab -e
```

```
# Daily database backup at 2 AM
0 2 * * * /var/www/academia/backup_db.sh

# Daily media backup at 3 AM
0 3 * * * /var/www/academia/backup_media.sh
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Server requirements met
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Database created and configured
- [ ] Environment variables set
- [ ] Security measures implemented

### Deployment
- [ ] Code deployed to server
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] Static files collected
- [ ] Services started with PM2
- [ ] Nginx configured and started
- [ ] SSL certificate installed

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Log rotation configured
- [ ] Performance monitoring active
- [ ] Security scanning completed

### Testing
- [ ] Frontend loads correctly
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Database connections stable
- [ ] File uploads working
- [ ] Email/SMS sending
- [ ] Payment processing
- [ ] All features functional

---

## 🔧 Maintenance

### Regular Tasks
1. **Daily**: Check logs for errors
2. **Weekly**: Review performance metrics
3. **Monthly**: Update dependencies
4. **Quarterly**: Security audit

### Updates
```bash
# Update application
cd /var/www/academia
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
pm2 restart academia-backend

# Update frontend
cd vite-project
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

### Troubleshooting
```bash
# Check service status
pm2 status
pm2 logs academia-backend

# Check nginx status
sudo systemctl status nginx
sudo nginx -t

# Check database
sudo systemctl status postgresql
psql -U academia_user -d academia_production -c "SELECT 1;"

# Check Redis
sudo systemctl status redis-server
redis-cli ping
```

---

## 📞 Support & Monitoring

### Monitoring Tools
- **PM2**: Process management
- **Nginx**: Web server monitoring
- **PostgreSQL**: Database monitoring
- **Redis**: Cache monitoring
- **System**: CPU, RAM, disk usage

### Alerting
- Set up email alerts for critical errors
- Monitor disk space usage
- Track application performance
- Monitor security events

---

*Last Updated: October 25, 2024*
*Version: 1.0.0*
