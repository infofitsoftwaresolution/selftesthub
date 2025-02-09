#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Pull the latest changes
cd /home/ubuntu/infofitscore
git pull

# Update environment variables
echo "Updating environment variables..."
cat > backend/.env << EOL
DATABASE_URL=postgresql://postgres:infofitsoftware@infofitscore.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/postgres
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["http://localhost:3000","http://${EC2_PUBLIC_IP}:3000"]
EOL

# Set permissions for entrypoint.sh
echo "Setting permissions for entrypoint.sh..."
chmod +x backend/entrypoint.sh

# Rebuild and restart containers
echo "Rebuilding and restarting containers..."
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d

echo "Deployment completed successfully!"

# Print the URLs
echo "Application URLs:"
echo "Frontend: https://your-domain.com"
echo "Backend API: https://your-domain.com/api" 