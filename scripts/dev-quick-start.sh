#!/bin/bash
# Quick Development Start Script
# This script just starts the development servers (assumes setup is already done)

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
    echo "║                    🚀 EPI-LOGOS DEV START                   ║"
    echo "║                   Quick Development Mode                     ║"
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

# Check if setup has been done
print_section "🔍 Checking development environment..."

# Check if venv exists
if [ ! -d ".venv" ]; then
    print_error "Python virtual environment not found!"
    echo "Please run setup first:"
    echo "  npm run setup"
    echo "  or"
    echo "  ./scripts/dev-start.sh"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_error "Node.js dependencies not found!"
    echo "Please run setup first:"
    echo "  npm install"
    exit 1
fi

print_success "Development environment ready"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your API keys before continuing"
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start infrastructure if needed
start_infrastructure() {
    print_section "🐳 Checking infrastructure services..."
    
    # Check if Qdrant is running
    if check_port 6333; then
        print_success "Qdrant is already running on port 6333"
    else
        print_status "Starting Qdrant vector database..."
        
        # Try to start existing container first
        if docker start epi-logos-qdrant >/dev/null 2>&1; then
            print_success "Started existing Qdrant container"
        else
            # If that fails, run docker-compose
            print_status "Creating new Qdrant container..."
            docker-compose up -d qdrant --quiet-pull 2>/dev/null || {
                print_warning "Docker compose failed, trying to remove existing container..."
                docker rm -f epi-logos-qdrant >/dev/null 2>&1 || true
                docker-compose up -d qdrant --quiet-pull
            }
            print_success "Qdrant container started"
        fi
        
        # Wait for Qdrant to be ready
        print_status "Waiting for Qdrant to be ready..."
        for i in {1..30}; do
            if curl -f http://localhost:6333/health >/dev/null 2>&1; then
                print_success "Qdrant is ready"
                break
            fi
            sleep 1
        done
    fi
}

# Function to start a service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local log_file="logs/${name}.log"
    
    mkdir -p logs
    
    # Check if service is already running
    if check_port $port; then
        print_warning "$name is already running on port $port"
        return
    fi
    
    print_status "Starting $name on port $port..."
    
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

# Start infrastructure
start_infrastructure

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
echo -e "${BLUE}📊 Monitor logs:${NC}"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/agentic.log"
echo "   tail -f logs/frontend.log"
echo ""
echo -e "${RED}🛑 Stop all services:${NC}"
echo "   npm stop"
echo "   or"
echo "   ./scripts/dev-stop.sh"
echo ""

print_success "Development environment is ready! 🎉"
