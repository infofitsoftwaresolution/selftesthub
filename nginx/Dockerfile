FROM nginx:alpine

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chmod -R 755 /var/cache/nginx \
    && mkdir -p /var/run \
    && chown -R nginx:nginx /var/run \
    && chmod -R 755 /var/run

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

USER nginx 