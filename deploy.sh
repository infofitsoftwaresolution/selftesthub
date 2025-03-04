#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Pull the latest changes
cd /home/ubuntu/infofitscore
git pull

# Create necessary directories
mkdir -p nginx/conf.d nginx/ssl nginx/certbot/conf nginx/certbot/www

# Update environment variables
echo "Updating environment variables..."
cat > backend/.env << EOL
DATABASE_URL=postgresql://postgres:infofitsoftware@infofitscore.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/postgres
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DOMAIN_NAME=selftesthub.com
EOL

# Set frontend environment
cat > frontend/.env << EOL
NODE_ENV=production
VITE_API_URL=https://selftesthub.com/api
EOL

# Set permissions
chmod +x backend/entrypoint.sh

# Clean up Docker resources
echo "Cleaning up Docker resources..."
docker system prune -af
docker volume prune -f
docker image prune -af

# Start nginx with initial configuration
echo "Starting Nginx for SSL setup..."
docker-compose up -d nginx

# Wait for Nginx to start
echo "Waiting for Nginx to start..."
sleep 10

# Get SSL certificate
if [ ! -d "nginx/certbot/conf/live/selftesthub.com" ]; then
    echo "Getting SSL certificate..."
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        --email admin@selftesthub.com \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d selftesthub.com -d www.selftesthub.com
fi

# Replace with full configuration
echo "Updating Nginx configuration..."
cat > nginx/conf.d/app.conf << 'EOL'
server {
    listen 80;
    server_name selftesthub.com www.selftesthub.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name selftesthub.com www.selftesthub.com;

    ssl_certificate /etc/letsencrypt/live/selftesthub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/selftesthub.com/privkey.pem;

    # SSL configurations
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
    limit_req zone=one burst=5 nodelay;
}
EOL

# Rebuild and restart all services
echo "Rebuilding and restarting all services..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "Deployment completed successfully!"

# Print the URLs
echo "Application URLs:"
echo "Frontend: https://selftesthub.com"
echo "Backend API: https://selftesthub.com/api"

# Check SSL certificate
echo "Checking SSL certificate..."
curl -I https://selftesthub.com 