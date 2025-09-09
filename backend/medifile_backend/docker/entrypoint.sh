#!/bin/sh
set -e

echo "[entrypoint] Applying migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files (if configured)..."
python manage.py collectstatic --noinput || true

echo "[entrypoint] Starting Django on 0.0.0.0:8000"
python manage.py runserver 0.0.0.0:8000


