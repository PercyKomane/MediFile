FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (psycopg2-binary not used yet, sqlite only). Add build/base tools for Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg62-turbo-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip && \
    pip install -r /app/requirements.txt

# Copy project
COPY . /app

# Expose Django port
EXPOSE 8000

# Create media directory at runtime if missing
RUN mkdir -p /app/media

# Entrypoint handles migrate/collectstatic and runserver
COPY docker/entrypoint.sh /entrypoint.sh
# Normalize line endings in case of CRLF on Windows hosts
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]


