#!/bin/bash
set -e

mkdir -p /app/logs

echo "Waiting for Redis..."
for i in {1..30}; do
  if python -c "import socket; socket.create_connection(('$REDIS_HOST', $REDIS_PORT), timeout=2)" 2>/dev/null; then
    echo "Redis is ready!"
    break
  fi
  echo "Waiting for Redis... ($i/30)"
  sleep 1
done

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"
