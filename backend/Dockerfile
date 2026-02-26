FROM python:3.11-slim

# Install system deps for Playwright + psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg curl libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libxshmfence1 fonts-liberation libappindicator3-1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium
RUN pip install playwright && playwright install chromium --with-deps

# Copy application code from backend folder
COPY backend/app/ ./app/

# Expose port
EXPOSE 8000

# Start server on dynamic PORT provided by Railway
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
