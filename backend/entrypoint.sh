#!/bin/bash
set -e

echo "Starting SelfTestHub backend..."

# Run migrations
echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete!"

# Start the application
WORKERS=${WEB_CONCURRENCY:-2}
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "$WORKERS"