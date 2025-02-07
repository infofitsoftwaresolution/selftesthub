#!/bin/sh

# Wait for a few seconds to ensure DB is ready
sleep 5

# Run migrations
alembic upgrade head

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 