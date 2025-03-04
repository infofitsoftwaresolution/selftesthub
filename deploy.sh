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

# Initial SSL certificate setup (only if not exists)
if [ ! -d "nginx/certbot/conf/live/selftesthub.com" ]; then
    echo "Setting up SSL certificate..."
    docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot \
        --email admin@selftesthub.com --agree-tos --no-eff-email \
        -d selftesthub.com -d www.selftesthub.com
fi

# Rebuild and restart containers
echo "Rebuilding and restarting containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "Deployment completed successfully!"

# Print the URLs
echo "Application URLs:"
echo "Frontend: https://selftesthub.com"
echo "Backend API: https://selftesthub.com/api" 