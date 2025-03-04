#!/bin/bash

# Ensure script runs with proper permissions
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# Install certbot
apt-get update
apt-get install -y certbot

# Stop nginx if running
docker-compose down

# Get SSL certificate
certbot certonly --standalone \
    --email admin@selftesthub.com \
    --agree-tos \
    --no-eff-email \
    -d selftesthub.com -d www.selftesthub.com

# Create SSL directory
mkdir -p nginx/ssl/live/selftesthub.com

# Copy certificates
cp /etc/letsencrypt/live/selftesthub.com/fullchain.pem nginx/ssl/live/selftesthub.com/
cp /etc/letsencrypt/live/selftesthub.com/privkey.pem nginx/ssl/live/selftesthub.com/

# Set proper permissions
chown -R ubuntu:ubuntu nginx/ssl
chmod -R 755 nginx/ssl

# Make certificates readable
chmod 644 nginx/ssl/live/selftesthub.com/*.pem

# Setup auto-renewal
echo "0 0 1 * * certbot renew --quiet && docker-compose restart nginx" | tee -a /var/spool/cron/crontabs/root

# Set proper ownership for the entire project directory
chown -R ubuntu:ubuntu /home/ubuntu/infofitscore 