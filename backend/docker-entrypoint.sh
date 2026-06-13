#!/bin/sh
set -e

echo "Running database migrations..."
sqlx migrate run --source /app/migrations

echo "Starting server..."
exec /app/yara-backend
