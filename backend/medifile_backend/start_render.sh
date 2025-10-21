#!/usr/bin/env bash
set -euo pipefail

# Move into the backend project directory (this script lives here)
cd "$(dirname "$0")"

# Ensure Django knows which settings to use
export DJANGO_SETTINGS_MODULE=medifile_backend.settings

echo "[Render] Running migrations..."
python manage.py migrate --noinput

if [ "${RUN_SEEDS:-0}" = "1" ]; then
  echo "[Render] Seeding initial data (hospitals, doctors, medicines, FAQs)..."
  # Optional: change hospital name or drop the flag to avoid assignment
  python manage.py seed_all --hospital "Johannesburg General Hospital" || true
fi

# Optionally update medicine images from mapping (set UPDATE_MEDICINE_IMAGES=1)
if [ "${UPDATE_MEDICINE_IMAGES:-0}" = "1" ]; then
  echo "[Render] Updating medicine images from mapping..."
  python manage.py update_medicine_images --file backend/medifile_backend/core/fixtures/medicine_images.json || true
fi

echo "[Render] Collecting static files..."
python manage.py collectstatic --noinput

echo "[Render] Starting Gunicorn..."
exec gunicorn medifile_backend.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers 3


