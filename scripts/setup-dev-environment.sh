#!/bin/bash
# Development Environment Setup Script for Epi-Logos System
# This script sets up the hybrid development environment with local Python and Docker infrastructure

set -e

echo "🚀 Setting up Epi-Logos System development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "agentic" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

# Check Python version compatibility
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
print_status "Detected Python version: $PYTHON_VERSION"

if [[ "$PYTHON_VERSION" == "3.13" ]]; then
    print_warning "Python 3.13 detected. Some packages may have compatibility issues."
    print_status "Installing with --no-deps and manual dependency resolution..."
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

print_success "Prerequisites check passed"

# Setup Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install --legacy-peer-deps
print_success "Node.js dependencies installed"

# Setup unified Python virtual environment
print_status "Setting up unified Python virtual environment..."

if [ ! -d ".venv" ]; then
    print_status "Creating unified virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip

    # Install compatible versions for Python 3.13
    if [[ "$PYTHON_VERSION" == "3.13" ]]; then
        print_status "Installing Python 3.13 compatible packages..."
        # Core framework packages
        pip install fastapi==0.115.8 uvicorn[standard]==0.34.0
        pip install pydantic==2.10.5 pydantic-settings==2.7.1

        # Database clients
        pip install neo4j==5.28.0 pymongo==4.10.1 redis==5.2.1 qdrant-client==1.15.1

        # Authentication
        pip install PyJWT==2.10.1 python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4

        # HTTP and utilities
        pip install httpx==0.28.1 aiofiles==24.1.0 python-dateutil==2.9.0
        pip install email-validator==2.2.0 python-multipart==0.0.20

        # Monitoring and logging
        pip install structlog==24.4.0 prometheus-client==0.21.1

        # LLM services
        pip install "openai[realtime]==1.102.0" anthropic==0.42.0
        pip install google-generativeai==0.8.3 langextract==1.0.9

        # Testing and development
        pip install pytest==8.4.1 pytest-asyncio==0.25.0 pytest-cov==6.0.0
        pip install black==24.10.0 ruff==0.8.6

        # Try pydantic-ai (may not work with Python 3.13)
        pip install pydantic-ai==0.0.14 || print_warning "pydantic-ai may not support Python 3.13 yet"
    else
        # For older Python versions, install from requirements files
        print_status "Installing from requirements files..."
        pip install -r backend/requirements.txt
        pip install -r agentic/requirements.txt
    fi
    print_success "Unified virtual environment created"
else
    print_warning "Virtual environment already exists"
    source .venv/bin/activate
    if [[ "$PYTHON_VERSION" == "3.13" ]]; then
        print_status "Updating Python 3.13 compatible packages..."
        pip install --upgrade fastapi==0.115.8 uvicorn[standard]==0.34.0
        pip install --upgrade pydantic==2.10.5 pydantic-settings==2.7.1
        pip install --upgrade neo4j==5.28.0 pymongo==4.10.1 redis==5.2.1 qdrant-client==1.15.1
        pip install --upgrade PyJWT==2.10.1 python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4
        pip install --upgrade httpx==0.28.1 aiofiles==24.1.0 python-dateutil==2.9.0
        pip install --upgrade email-validator==2.2.0 python-multipart==0.0.20
        pip install --upgrade structlog==24.4.0 prometheus-client==0.21.1
        pip install --upgrade "openai[realtime]==1.102.0" anthropic==0.42.0
        pip install --upgrade google-generativeai==0.8.3 langextract==1.0.9
        pip install --upgrade pytest==8.4.1 pytest-asyncio==0.25.0 pytest-cov==6.0.0
        pip install --upgrade black==24.10.0 ruff==0.8.6
        pip install --upgrade pydantic-ai==0.0.14 || print_warning "pydantic-ai may not support Python 3.13 yet"
    else
        pip install --upgrade -r backend/requirements.txt
        pip install --upgrade -r agentic/requirements.txt
    fi
    print_success "Dependencies updated"
fi

# Setup environment file
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your actual configuration values"
else
    print_warning ".env file already exists"
fi

# Start infrastructure services
print_status "Starting infrastructure services with Docker..."
docker-compose up -d qdrant
print_success "Infrastructure services started"

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Test infrastructure
print_status "Testing infrastructure connectivity..."

# Test Qdrant
if curl -f http://localhost:6333/health > /dev/null 2>&1; then
    print_success "Qdrant is running and healthy"
else
    print_warning "Qdrant may not be ready yet (this is normal on first startup)"
fi

print_success "Development environment setup complete!"

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Edit .env file with your database credentials:"
echo "   - NEO4J_URI, NEO4J_PASSWORD (Neo4j Aura)"
echo "   - MONGODB_URI (MongoDB Atlas)"  
echo "   - REDIS_URL (Redis Cloud)"
echo "   - API keys (OpenAI, Anthropic, etc.)"
echo ""
echo "2. Start development servers:"
echo "   Terminal 1: npm run dev:frontend"
echo "   Terminal 2: npm run dev:backend"
echo "   Terminal 3: npm run dev:agentic"
echo ""
echo "3. Or use the unified command:"
echo "   npm run dev"
echo ""
echo "📚 Development URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   Agentic:   http://localhost:8001"
echo "   Qdrant:    http://localhost:6333"
echo ""
echo "🧪 Run tests:"
echo "   npm run test:structure"
echo "   npm run test:backend"
echo "   npm run test:agentic"
echo ""
