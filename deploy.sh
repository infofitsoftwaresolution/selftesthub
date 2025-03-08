#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Check disk space
echo "Checking disk space..."
DISK_SPACE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_SPACE" -gt 85 ]; then
    echo "Warning: Disk space is at ${DISK_SPACE}%. Cleaning up..."
    docker system prune -af
    docker volume prune -f
    sudo find /var/lib/docker/containers/ -type f -name "*.log" -delete
    sudo journalctl --vacuum-time=1d
    sudo apt-get clean
    sudo apt-get autoremove -y
fi

# Ensure we're in the right directory
cd /home/ubuntu/infofitscore

# Fix Docker permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/.docker
sudo chmod -R 755 /home/ubuntu/.docker

# Ensure correct directory ownership and permissions
sudo chown -R ubuntu:ubuntu .
sudo find . -type d -exec chmod 755 {} \;
sudo find . -type f -exec chmod 644 {} \;

# Make scripts executable
chmod +x deploy.sh setup-ssl.sh
chmod +x backend/entrypoint.sh || true

# Verify domain DNS
echo "Verifying domain DNS..."
if ! host selftesthub.com; then
    echo "Error: Domain selftesthub.com is not properly configured"
    exit 1
fi

# Create necessary directories if they don't exist
mkdir -p nginx/conf.d nginx/ssl
chmod -R 755 nginx

# Add before docker-compose up
echo "Creating Nginx temp directories..."
mkdir -p /tmp/nginx/{client_temp,proxy_temp,fastcgi_temp,uwsgi_temp,scgi_temp}
chmod -R 755 /tmp/nginx

# Run SSL setup if certificates don't exist
if [ ! -f "nginx/ssl/live/selftesthub.com/fullchain.pem" ]; then
    echo "Setting up SSL certificates..."
    sudo ./setup-ssl.sh
fi

# Update code from repository
echo "Updating code from repository..."
git fetch origin main
git reset --hard origin/main

# Add this after git reset --hard origin/main
echo "Setting proper permissions..."
sudo chown -R ubuntu:ubuntu .
sudo find . -type d -exec chmod 755 {} \;
sudo find . -type f -exec chmod 644 {} \;

# Make all shell scripts executable
find . -type f -name "*.sh" -exec chmod +x {} \;

# Specifically ensure entrypoint.sh is executable
chmod +x backend/entrypoint.sh

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
VITE_API_URL=https://selftesthub.com
EOL

# Add at the beginning of the script, after cd into directory
echo "Cleaning up Docker resources.."
docker-compose down || true
docker system prune -af || true
docker volume prune -f || true

# Clean up logs
sudo find /var/lib/docker/containers/ -type f -name "*.log" -delete || true
sudo journalctl --vacuum-time=1d || true

# Clean apt cache
sudo apt-get clean || true
sudo apt-get autoremove -y || true

# Update Nginx configuration
echo "Updating Nginx configuration..."
cat > nginx/conf.d/app.conf << 'EOL'
# Add at the beginning of the file
error_log /var/log/nginx/error.log debug;
access_log /var/log/nginx/access.log combined;

# HTTP server (temporary for SSL setup)
server {
    listen 80;
    server_name selftesthub.com www.selftesthub.com;
    
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
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTPS
server {
    listen 443 ssl;
    server_name selftesthub.com www.selftesthub.com;

    ssl_certificate /etc/nginx/ssl/live/selftesthub.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/selftesthub.com/privkey.pem;

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
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be up
echo "Waiting for services to start..."
sleep 10

# Verify SSL certificates
if [ -f "nginx/ssl/live/selftesthub.com/fullchain.pem" ]; then
    echo "SSL certificates found, updating Nginx configuration for HTTPS..."
    # Update Nginx configuration to include HTTPS
    cat > nginx/conf.d/app.conf << 'EOL'
# Add at the beginning of the file
error_log /var/log/nginx/error.log debug;
access_log /var/log/nginx/access.log combined;

# HTTP - redirect all requests to HTTPS
server {
    listen 80;
    server_name selftesthub.com www.selftesthub.com;
    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl;
    server_name selftesthub.com www.selftesthub.com;

    ssl_certificate /etc/nginx/ssl/live/selftesthub.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/selftesthub.com/privkey.pem;

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
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

    # Reload Nginx configuration using docker-compose
    echo "Reloading Nginx configuration..."
    docker-compose exec nginx nginx -s reload || {
        echo "Failed to reload Nginx directly, trying to restart container..."
        docker-compose restart nginx
    }
fi

# Rebuild and restart containers
echo "Rebuilding and restarting containers..."
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 15

# Verify services are running
echo "Verifying services..."
if ! docker-compose ps | grep -q "Up"; then
    echo "Error: Some services are not running"
    docker-compose logs
    exit 1
fi

echo "Deployment completed successfully!"

# Print the URLs
echo "Application URLs:"
echo "Frontend: https://selftesthub.com"
echo "Backend API: https://selftesthub.com/api" 