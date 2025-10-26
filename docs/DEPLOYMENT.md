# Academia Platform Deployment Guide

Comprehensive deployment guide for the Academia educational platform, covering production setup, environment configuration, scaling, and maintenance.

## 🚀 Overview

This guide covers deploying the Academia platform to production, including:

- **Backend Deployment**: Django application with PostgreSQL
- **Frontend Deployment**: React application with CDN
- **Infrastructure Setup**: Redis, Nginx, SSL, monitoring
- **Scaling**: Horizontal and vertical scaling strategies
- **Maintenance**: Backups, updates, monitoring

## 📋 Prerequisites

### Server Requirements

**Minimum Requirements**:
- **CPU**: 2 cores, 2.4GHz
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+

**Recommended Production**:
- **CPU**: 4+ cores, 3.0GHz+
- **RAM**: 8GB+
- **Storage**: 100GB+ SSD
- **OS**: Ubuntu 22.04 LTS

### Software Requirements

**Backend**:
- Python 3.11+
- PostgreSQL 13+
- Redis 6+
- Nginx 1.18+

**Frontend**:
- Node.js 18+
- npm 8+

**Additional**:
- Git
- SSL certificates
- Domain name
- CDN account (optional)

## 🔧 Environment Setup

### 1. Server Preparation

**Update System**:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

**Create Application User**:
```bash
sudo adduser academia
sudo usermod -aG sudo academia
sudo su - academia
```

### 2. Python Environment

**Install Python 3.11**:
```bash
sudo apt install -y python3.11 python3.11-venv python3.11-dev
python3.11 --version
```

**Create Virtual Environment**:
```bash
cd /opt/academia
python3.11 -m venv venv
source venv/bin/activate
```

### 3. Database Setup

**Install PostgreSQL**:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Create Database**:
```bash
sudo -u postgres psql
CREATE DATABASE academia_db;
CREATE USER academia_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE academia_db TO academia_user;
\q
```

### 4. Redis Setup

**Install Redis**:
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Configure Redis**:
```bash
sudo nano /etc/redis/redis.conf
# Set: requirepass your_redis_password
sudo systemctl restart redis-server
```

## 🐍 Backend Deployment

### 1. Application Setup

**Clone Repository**:
```bash
cd /opt/academia
git clone https://github.com/your-org/academia.git
cd academia
```

**Install Dependencies**:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Configuration

**Create Production Environment**:
```bash
cp .env.example .env
nano .env
```

**Production Environment Variables**:
```bash
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=academia_db
DB_USER=academia_user
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=your_redis_password

# Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=academia-media
AWS_S3_ENDPOINT_URL=https://your-s3-endpoint.com
AWS_S3_CUSTOM_DOMAIN=cdn.yourdomain.com

# External Services
GOOGLE_AI_API_KEY=your-google-ai-key
SMS_API_KEY=your-sms-api-key
ZARINPAL_MERCHANT_ID=your-merchant-id

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_COOKIES=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### 3. Database Migration

**Run Migrations**:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 4. Gunicorn Setup

**Install Gunicorn**:
```bash
pip install gunicorn
```

**Create Gunicorn Configuration**:
```bash
nano /opt/academia/gunicorn.conf.py
```

**Gunicorn Configuration**:
```python
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

**Create Systemd Service**:
```bash
sudo nano /etc/systemd/system/academia.service
```

**Systemd Service Configuration**:
```ini
[Unit]
Description=Academia Django Application
After=network.target

[Service]
Type=notify
User=academia
Group=academia
WorkingDirectory=/opt/academia
Environment=PATH=/opt/academia/venv/bin
ExecStart=/opt/academia/venv/bin/gunicorn --config gunicorn.conf.py api.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

**Start Service**:
```bash
sudo systemctl daemon-reload
sudo systemctl start academia
sudo systemctl enable academia
sudo systemctl status academia
```

## ⚛️ Frontend Deployment

### 1. Application Setup

**Navigate to Frontend**:
```bash
cd /opt/academia/vite-project
```

**Install Dependencies**:
```bash
npm install
```

### 2. Environment Configuration

**Create Production Environment**:
```bash
cp .env.example .env.production
nano .env.production
```

**Production Environment Variables**:
```bash
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Academia
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
VITE_ANALYTICS_ID=your-analytics-id
```

### 3. Build Application

**Production Build**:
```bash
npm run build
```

**Build Output**:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── images/
└── manifest.json
```

### 4. Static File Serving

**Copy Build Files**:
```bash
sudo cp -r dist/* /var/www/academia/
sudo chown -R www-data:www-data /var/www/academia/
```

## 🌐 Nginx Configuration

### 1. Install Nginx

**Install Nginx**:
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. SSL Certificate

**Install Certbot**:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

**Obtain SSL Certificate**:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Nginx Configuration

**Create Site Configuration**:
```bash
sudo nano /etc/nginx/sites-available/academia
```

**Nginx Configuration**:
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream backend
upstream academia_backend {
    server 127.0.0.1:8000;
}

# Main server block
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
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (React app)
    location / {
        root /var/www/academia;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API backend
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://academia_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://academia_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (Django)
    location /static/ {
        alias /opt/academia/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files (S3/CDN)
    location /media/ {
        proxy_pass https://cdn.yourdomain.com/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Admin interface
    location /admin/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://academia_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable Site**:
```bash
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 WebSocket Deployment

### 1. Daphne Setup

**Install Daphne**:
```bash
pip install daphne
```

**Create Daphne Configuration**:
```bash
nano /opt/academia/daphne.conf.py
```

**Daphne Configuration**:
```python
bind = "127.0.0.1:8001"
workers = 2
worker_class = "asyncio"
max_requests = 1000
timeout = 30
```

### 2. WebSocket Service

**Create Systemd Service**:
```bash
sudo nano /etc/systemd/system/academia-websocket.service
```

**WebSocket Service Configuration**:
```ini
[Unit]
Description=Academia WebSocket Server
After=network.target

[Service]
Type=notify
User=academia
Group=academia
WorkingDirectory=/opt/academia
Environment=PATH=/opt/academia/venv/bin
ExecStart=/opt/academia/venv/bin/daphne --config daphne.conf.py api.asgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

**Start WebSocket Service**:
```bash
sudo systemctl daemon-reload
sudo systemctl start academia-websocket
sudo systemctl enable academia-websocket
```

## 📊 Monitoring Setup

### 1. Log Management

**Create Log Directories**:
```bash
sudo mkdir -p /var/log/academia
sudo chown academia:academia /var/log/academia
```

**Configure Logging**:
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/academia/django.log',
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/academia/error.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'error_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### 2. Health Checks

**Create Health Check Script**:
```bash
nano /opt/academia/health_check.py
```

**Health Check Script**:
```python
#!/usr/bin/env python3
import requests
import sys

def check_health():
    try:
        response = requests.get('http://localhost:8000/api/health/', timeout=5)
        if response.status_code == 200:
            print("Health check passed")
            return True
        else:
            print(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"Health check error: {e}")
        return False

if __name__ == "__main__":
    if not check_health():
        sys.exit(1)
```

**Make Executable**:
```bash
chmod +x /opt/academia/health_check.py
```

### 3. Monitoring Script

**Create Monitoring Script**:
```bash
nano /opt/academia/monitor.sh
```

**Monitoring Script**:
```bash
#!/bin/bash

# Check Django service
if ! systemctl is-active --quiet academia; then
    echo "Django service is down, restarting..."
    systemctl restart academia
fi

# Check WebSocket service
if ! systemctl is-active --quiet academia-websocket; then
    echo "WebSocket service is down, restarting..."
    systemctl restart academia-websocket
fi

# Check database connection
python3 /opt/academia/health_check.py
```

**Add to Crontab**:
```bash
crontab -e
# Add: */5 * * * * /opt/academia/monitor.sh
```

## 🔄 Backup Strategy

### 1. Database Backup

**Create Backup Script**:
```bash
nano /opt/academia/backup_db.sh
```

**Database Backup Script**:
```bash
#!/bin/bash

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="academia_db"
DB_USER="academia_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/academia_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/academia_db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "academia_db_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: academia_db_$DATE.sql.gz"
```

**Schedule Database Backup**:
```bash
chmod +x /opt/academia/backup_db.sh
crontab -e
# Add: 0 2 * * * /opt/academia/backup_db.sh
```

### 2. Media Backup

**Create Media Backup Script**:
```bash
nano /opt/academia/backup_media.sh
```

**Media Backup Script**:
```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/media"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup media files (if stored locally)
if [ -d "/opt/academia/media" ]; then
    tar -czf $BACKUP_DIR/media_$DATE.tar.gz -C /opt/academia media
    echo "Media backup completed: media_$DATE.tar.gz"
fi

# Keep only last 30 days of media backups
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +30 -delete
```

## 📈 Scaling Strategies

### 1. Horizontal Scaling

**Load Balancer Setup**:
```nginx
upstream academia_backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}
```

**Multiple Application Servers**:
- Deploy to multiple servers
- Use load balancer (Nginx/HAProxy)
- Session affinity for WebSockets
- Database read replicas

### 2. Database Scaling

**Read Replicas**:
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'academia_db',
        'USER': 'academia_user',
        'PASSWORD': 'secure_password',
        'HOST': 'master-db.example.com',
        'PORT': '5432',
    },
    'read_replica': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'academia_db',
        'USER': 'academia_user',
        'PASSWORD': 'secure_password',
        'HOST': 'replica-db.example.com',
        'PORT': '5432',
    }
}
```

### 3. Caching Strategy

**Redis Cluster**:
```bash
# Redis cluster configuration
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1
```

## 🔧 Maintenance

### 1. Updates

**Application Updates**:
```bash
cd /opt/academia
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart academia
sudo systemctl restart academia-websocket
```

**System Updates**:
```bash
sudo apt update && sudo apt upgrade -y
sudo systemctl restart nginx
```

### 2. Performance Monitoring

**Resource Monitoring**:
```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Network connections
netstat -tulpn

# Database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

**Application Monitoring**:
```bash
# Django logs
tail -f /var/log/academia/django.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u academia -f
```

### 3. Security Updates

**SSL Certificate Renewal**:
```bash
sudo certbot renew --dry-run
sudo certbot renew
```

**Security Hardening**:
```bash
# Firewall setup
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Fail2ban setup
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## 🚨 Troubleshooting

### Common Issues

**Django Service Won't Start**:
```bash
sudo systemctl status academia
sudo journalctl -u academia -f
```

**Database Connection Issues**:
```bash
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

**Nginx Configuration Issues**:
```bash
sudo nginx -t
sudo systemctl status nginx
```

**WebSocket Connection Issues**:
```bash
sudo systemctl status academia-websocket
sudo journalctl -u academia-websocket -f
```

### Performance Issues

**High CPU Usage**:
- Check for infinite loops
- Optimize database queries
- Add caching
- Scale horizontally

**High Memory Usage**:
- Check for memory leaks
- Optimize application code
- Increase server memory
- Use memory profiling

**Slow Database Queries**:
- Add database indexes
- Optimize queries
- Use read replicas
- Implement query caching

## 📚 Related Documentation

- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Development Guide](DEVELOPMENT.md)
- [Security Guide](SECURITY.md)

---

**Deployment Guide** - Comprehensive production deployment documentation
