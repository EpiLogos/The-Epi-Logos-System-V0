# LightRAG Service Dockerfile
FROM python:3.13-slim

LABEL maintainer="Epi-Logos System"
LABEL service="lightrag-foundation"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV LIGHTRAG_WORKSPACE=gnostic
ENV LIGHTRAG_WORKING_DIR=/app/workspaces/gnostic

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create workspace directory
RUN mkdir -p /app/workspaces/gnostic

# Copy requirements first for better caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Install LightRAG and dependencies
RUN pip install --no-cache-dir lightrag-hku==1.4.7 google-generativeai

# Copy the LightRAG service code
COPY backend/services/lightrag /app/backend/services/lightrag
COPY backend/__init__.py /app/backend/
COPY backend/config /app/backend/config

# Create non-root user for security
RUN useradd -m -u 1000 lightrag && \
    chown -R lightrag:lightrag /app
USER lightrag

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "from backend.services.lightrag.service import get_lightrag_service; s=get_lightrag_service(); print('healthy' if s.health_check()['healthy'] else exit(1))"

# Expose port for health checks (if needed)
EXPOSE 8080

# Default command - can be overridden
CMD ["python", "-c", "from backend.services.lightrag.service import get_lightrag_service; service = get_lightrag_service(); print(f'LightRAG service started in workspace: {service.workspace}'); import time; time.sleep(3600)"]