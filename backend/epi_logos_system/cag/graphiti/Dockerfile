# Dockerfile for Graphiti MCP Foundation Service
FROM python:3.13.7-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY . .

# Set Python path to include parent directories for relative imports
ENV PYTHONPATH="/app:/app/backend"

# Create non-root user for security
RUN groupadd -r graphiti && useradd -r -g graphiti graphiti
RUN chown -R graphiti:graphiti /app
USER graphiti

# Expose ports
EXPOSE 8001  # HTTP API port
EXPOSE 3001  # MCP server port (stdio via TCP wrapper)

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/graphiti/health || exit 1

# Default command (can be overridden)
CMD ["python", "-m", "uvicorn", "backend.services.graphiti.api:router", "--host", "0.0.0.0", "--port", "8001"]