#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Pull the latest changes
cd /home/ubuntu/infofitscore
git pull

# Create necessary directories if they don't exist
mkdir -p nginx/conf.d nginx/ssl

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
server {
    listen 80;
    server_name selftesthub.com www.selftesthub.com;
    
    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name selftesthub.com www.selftesthub.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/live/selftesthub.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/selftesthub.com/privkey.pem;

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

# Rebuild and restart all services
echo "Rebuilding and restarting services..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "Deployment completed successfully!"

# Print the URLs
echo "Application URLs:"
echo "Frontend: https://selftesthub.com"
echo "Backend API: https://selftesthub.com/api" 