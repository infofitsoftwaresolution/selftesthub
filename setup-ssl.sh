#!/bin/bash

# Ensure script runs with proper permissions
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# Ensure we're in the right directory
cd /home/ubuntu/infofitscore

# Install certbot
apt-get update
apt-get install -y certbot

# Stop nginx if running
docker-compose down || true

# Get SSL certificate with force-renewal
certbot certonly --standalone \
    --email admin@selftesthub.com \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d selftesthub.com -d www.selftesthub.com -d utrains.selftesthub.com \
    --non-interactive

# Create SSL directory
mkdir -p nginx/ssl/live/selftesthub.com

# Copy certificates
cp /etc/letsencrypt/live/selftesthub.com/fullchain.pem nginx/ssl/live/selftesthub.com/
cp /etc/letsencrypt/live/selftesthub.com/privkey.pem nginx/ssl/live/selftesthub.com/

# Set proper permissions
chown -R ubuntu:ubuntu nginx/ssl
chmod -R 755 nginx/ssl
chmod 644 nginx/ssl/live/selftesthub.com/*.pem

# Setup auto-renewal (using absolute paths)
echo "0 0 1 * * /usr/bin/certbot renew --quiet && cd /home/ubuntu/infofitscore && /usr/local/bin/docker-compose restart nginx" | tee -a /var/spool/cron/crontabs/root

# Set proper ownership for the entire project directory
chown -R ubuntu:ubuntu .
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod +x deploy.sh setup-ssl.sh
chmod +x backend/entrypoint.sh || true 