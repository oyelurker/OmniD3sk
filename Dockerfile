FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY server/ ./server/
COPY omniflow/ ./omniflow/
COPY dist/ ./dist/

# Cloud Run injects PORT env var (default 8080)
ENV PORT=8080

EXPOSE 8080

CMD uvicorn server.main:app --host 0.0.0.0 --port $PORT
