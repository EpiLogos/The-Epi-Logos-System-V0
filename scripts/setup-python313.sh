#!/bin/bash
# Python 3.13 Compatible Setup Script
# This script installs only the packages that work with Python 3.13

set -e

echo "🐍 Setting up Python 3.13 compatible environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Backend setup
print_status "Setting up backend with Python 3.13 compatible packages..."
cd backend

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip

# Core packages that work with Python 3.13
print_status "Installing core backend packages..."
pip install fastapi==0.115.8
pip install uvicorn[standard]==0.34.0
pip install pydantic==2.10.5
pip install pydantic-settings==2.7.1

# Database drivers
print_status "Installing database drivers..."
pip install neo4j==5.28.0
pip install pymongo==4.10.1
pip install redis==5.2.1
pip install qdrant-client==1.15.1

# Authentication
print_status "Installing authentication packages..."
pip install PyJWT==2.10.1
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4

# Utilities
print_status "Installing utility packages..."
pip install httpx==0.28.1
pip install aiofiles==24.1.0
pip install python-dateutil==2.9.0
pip install email-validator==2.2.0
pip install python-multipart==0.0.20

# Logging and monitoring
print_status "Installing logging packages..."
pip install structlog==24.4.0
pip install prometheus-client==0.21.1

# Development tools
print_status "Installing development tools..."
pip install pytest==8.4.1
pip install pytest-asyncio==0.25.0
pip install pytest-cov==6.0.0
pip install black==24.10.0
pip install ruff==0.8.6

cd ..
print_success "Backend setup complete"

# Agentic setup
print_status "Setting up agentic with Python 3.13 compatible packages..."
cd agentic

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip

# Core packages
print_status "Installing core agentic packages..."
pip install pydantic==2.10.5
pip install pydantic-settings==2.7.1
pip install fastapi==0.115.8
pip install uvicorn[standard]==0.34.0

# AI packages
print_status "Installing AI packages..."
pip install openai==1.102.0
pip install anthropic==0.42.0
pip install google-generativeai==0.8.3
pip install langextract==1.0.9

# Try pydantic-ai (may not work with 3.13)
print_status "Attempting to install pydantic-ai..."
pip install pydantic-ai==0.0.14 || print_warning "pydantic-ai installation failed - this is expected with Python 3.13"

# Utilities
print_status "Installing utility packages..."
pip install httpx==0.28.1
pip install aiofiles==24.1.0
pip install python-dateutil==2.9.0

# Development tools
print_status "Installing development tools..."
pip install pytest==8.4.1
pip install pytest-asyncio==0.25.0
pip install pytest-cov==6.0.0
pip install black==24.10.0
pip install ruff==0.8.6

cd ..
print_success "Agentic setup complete"

# Start infrastructure
print_status "Starting Qdrant infrastructure..."
docker-compose up -d qdrant || print_warning "Docker not available or Qdrant failed to start"

print_success "Python 3.13 setup complete!"

echo ""
echo "🎯 Next Steps:"
echo "1. Copy .env.example to .env and configure your credentials"
echo "2. Test the setup:"
echo "   npm run test:backend"
echo "   npm run test:agentic"
echo "3. Start development:"
echo "   npm run dev"
echo ""
echo "⚠️  Note: Some packages may have limited functionality with Python 3.13"
echo "   Consider using Python 3.11 or 3.12 for full compatibility"
