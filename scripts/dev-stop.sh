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

# Stop Docker services (but keep containers for next start)
docker-compose stop qdrant --quiet 2>/dev/null || true

echo "🎯 All services stopped"
echo ""
echo "💡 To completely remove containers and start fresh:"
echo "   docker-compose down"
