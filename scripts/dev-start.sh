#!/bin/bash
# Ultimate Development Startup Script for Epi-Logos System
# This script sets up everything and starts all development servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🧠 EPI-LOGOS SYSTEM V0.1                 ║"
    echo "║                  Development Environment                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

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

print_section() {
    echo -e "${CYAN}▶ $1${NC}"
}

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "agentic" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_header

# Function to setup unified Python environment
setup_python_env() {
    print_section "Setting up unified Python environment..."

    if [ ! -d ".venv" ]; then
        print_status "Creating virtual environment..."
        python3 -m venv .venv
    fi

    source .venv/bin/activate
    pip install --upgrade pip --quiet

    # Install all Python dependencies for both backend and agentic
    print_status "Installing Python dependencies..."

    # Combined dependencies for both backend and agentic
    pip install --quiet \
        fastapi==0.115.8 \
        uvicorn[standard]==0.34.0 \
        pydantic==2.10.5 \
        pydantic-settings==2.7.1 \
        neo4j==5.28.0 \
        pymongo==4.10.1 \
        redis==5.2.1 \
        qdrant-client==1.15.1 \
        PyJWT==2.10.1 \
        python-jose[cryptography]==3.3.0 \
        passlib[bcrypt]==1.7.4 \
        httpx==0.28.1 \
        aiofiles==24.1.0 \
        python-dateutil==2.9.0 \
        email-validator==2.2.0 \
        python-multipart==0.0.20 \
        structlog==24.4.0 \
        prometheus-client==0.21.1 \
        "openai[realtime]==1.102.0" \
        anthropic==0.42.0 \
        google-generativeai==0.8.3 \
        langextract==1.0.9 \
        pytest==8.4.1 \
        pytest-asyncio==0.25.0 \
        pytest-cov==6.0.0 \
        black==24.10.0 \
        ruff==0.8.6

    # Try pydantic-ai (may not work with Python 3.13)
    pip install pydantic-ai==0.0.14 --quiet || print_warning "pydantic-ai may not support Python 3.13 yet"

    print_success "Unified Python environment ready"
}

# Setup environment
print_section "🐍 Setting up Python environment..."
setup_python_env

# Setup Node.js
print_section "📦 Setting up Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install --legacy-peer-deps --silent
    print_success "Node.js dependencies installed"
else
    print_status "Node.js dependencies already installed"
fi

# Setup environment file
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your actual API keys and database credentials"
else
    print_status ".env file already exists"
fi

# Start infrastructure
print_section "🐳 Starting infrastructure services..."
if command -v docker &> /dev/null; then
    print_status "Starting Qdrant vector database..."
    docker-compose up -d qdrant --quiet-pull
    
    # Wait for Qdrant to be ready
    print_status "Waiting for Qdrant to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:6333/health > /dev/null 2>&1; then
            print_success "Qdrant is ready"
            break
        fi
        sleep 1
    done
else
    print_warning "Docker not found. Please install Docker to run infrastructure services."
fi

# Function to start a service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local log_file="logs/${name}.log"
    
    mkdir -p logs
    
    print_status "Starting $name on port $port..."
    
    # Kill existing process on port if any
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Start the service
    eval "$command" > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "logs/${name}.pid"
    
    # Wait a moment and check if it's running
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        print_success "$name started (PID: $pid)"
    else
        print_error "$name failed to start. Check $log_file for details."
    fi
}

# Start all services
print_section "🚀 Starting development servers..."

# Start backend
start_service "backend" "source .venv/bin/activate && cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000" "8000"

# Start agentic
start_service "agentic" "source .venv/bin/activate && cd agentic && uvicorn main:app --reload --host 0.0.0.0 --port 8001" "8001"

# Start frontend
start_service "frontend" "npm run dev:frontend" "3000"

# Display status
print_section "🎯 Development Environment Ready!"

echo ""
echo -e "${GREEN}✅ All services are running:${NC}"
echo -e "   🌐 Frontend:  ${CYAN}http://localhost:3000${NC}"
echo -e "   🔧 Backend:   ${CYAN}http://localhost:8000${NC}"
echo -e "   🤖 Agentic:   ${CYAN}http://localhost:8001${NC}"
echo -e "   🔍 Qdrant:    ${CYAN}http://localhost:6333${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "   1. Edit .env file with your API keys:"
echo "      - GEMINI_API_KEY (for Google Gemini + LangExtract)"
echo "      - OPENAI_API_KEY (for GPT Realtime API)"
echo "      - ANTHROPIC_API_KEY (for Claude)"
echo "      - NEO4J_URI, MONGODB_URI, REDIS_URL (cloud databases)"
echo ""
echo "   2. Test the setup:"
echo "      npm run test:structure"
echo "      npm run test:backend"
echo "      npm run test:agentic"
echo ""
echo -e "${BLUE}📊 Monitor logs:${NC}"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/agentic.log"
echo "   tail -f logs/frontend.log"
echo ""
echo -e "${RED}🛑 Stop all services:${NC}"
echo "   ./scripts/dev-stop.sh"
echo ""

# Create stop script
cat > scripts/dev-stop.sh << 'EOF'
#!/bin/bash
# Stop all development services

echo "🛑 Stopping all development services..."

# Kill services by PID files
for service in backend agentic frontend; do
    if [ -f "logs/${service}.pid" ]; then
        pid=$(cat "logs/${service}.pid")
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            echo "✅ Stopped $service (PID: $pid)"
        fi
        rm -f "logs/${service}.pid"
    fi
done

# Kill by port as backup
for port in 3000 8000 8001; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# Stop Docker services
docker-compose down --quiet 2>/dev/null || true

echo "🎯 All services stopped"
EOF

chmod +x scripts/dev-stop.sh

print_success "Development environment is ready! 🎉"
