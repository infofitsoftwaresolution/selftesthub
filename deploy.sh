#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Ensure correct directory ownership and permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/infofitscore
sudo chmod -R 755 /home/ubuntu/infofitscore

# Pull the latest changes
cd /home/ubuntu/infofitscore
git pull

# Create necessary directories if they don't exist
mkdir -p nginx/conf.d nginx/ssl

# Ensure correct permissions for all files
sudo chown -R ubuntu:ubuntu .
sudo chmod -R 755 .

# Run SSL setup if certificates don't exist
if [ ! -f "nginx/ssl/live/selftesthub.com/fullchain.pem" ]; then
    echo "Setting up SSL certificates..."
    chmod +x setup-ssl.sh
    ./setup-ssl.sh
fi

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

# Clean up Docker resources (but keep volumes)
echo "Cleaning up Docker resources..."
docker system prune -f
docker image prune -f

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
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://backend:8000;
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
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

    # Reload Nginx configuration
    docker exec infofitscore_nginx_1 nginx -s reload
fi

echo "Deployment completed successfully!"

# Print the URLs
echo "Application URLs:"
echo "Frontend: https://selftesthub.com"
echo "Backend API: https://selftesthub.com/api" 