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
EC2_PUBLIC_IP=${EC2_PUBLIC_IP}
EOL

# Set frontend environment
cat > frontend/.env << EOL
NODE_ENV=production
VITE_API_URL=http://${EC2_PUBLIC_IP}:8000
EOL

# Set permissions for entrypoint.sh
echo "Setting permissions for entrypoint.sh..."
chmod +x backend/entrypoint.sh

# Add before rebuilding containers
echo "Cleaning up Docker resources..."
sudo docker system prune -a -f

# Rebuild and restart containers
echo "Rebuilding and restarting containers..."
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d

echo "Deployment completed successfully!"

# Print the URLs
echo "Application URLs:"
echo "Frontend: http://${EC2_PUBLIC_IP}:3000"
echo "Backend API: http://${EC2_PUBLIC_IP}:8000/api/v1" 