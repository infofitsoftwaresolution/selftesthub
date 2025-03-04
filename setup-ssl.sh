#!/bin/bash

# Install certbot
sudo apt-get update
sudo apt-get install -y certbot

# Stop nginx if running
docker-compose down

# Get SSL certificate
sudo certbot certonly --standalone \
    --email admin@selftesthub.com \
    --agree-tos \
    --no-eff-email \
    -d selftesthub.com -d www.selftesthub.com

# Create SSL directory
sudo mkdir -p nginx/ssl/live/selftesthub.com

# Copy certificates
sudo cp /etc/letsencrypt/live/selftesthub.com/fullchain.pem nginx/ssl/live/selftesthub.com/
sudo cp /etc/letsencrypt/live/selftesthub.com/privkey.pem nginx/ssl/live/selftesthub.com/

# Set proper permissions
sudo chown -R ubuntu:ubuntu nginx/ssl
sudo chmod -R 755 nginx/ssl

# Setup auto-renewal
echo "0 0 1 * * certbot renew --quiet && docker-compose restart nginx" | sudo tee -a /var/spool/cron/crontabs/root 