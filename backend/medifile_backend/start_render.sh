#!/usr/bin/env bash
set -euo pipefail

# Move into the backend project directory (this script lives here)
cd "$(dirname "$0")"

# Ensure Django knows which settings to use
export DJANGO_SETTINGS_MODULE=medifile_backend.settings

echo "[Render] Running migrations..."
python manage.py migrate --noinput

echo "[Render] Collecting static files..."
python manage.py collectstatic --noinput

echo "[Render] Starting Gunicorn..."
exec gunicorn medifile_backend.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers 3


