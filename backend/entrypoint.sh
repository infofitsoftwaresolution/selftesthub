#!/bin/bash
set -e

echo "Starting SelfTestHub backend..."

# Run migrations
echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete!"

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload