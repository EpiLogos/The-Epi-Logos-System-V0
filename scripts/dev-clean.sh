#!/bin/bash
# Clean up development environment completely

echo "🧹 Cleaning up development environment..."

# Stop all services first
./scripts/dev-stop.sh

# Remove Docker containers and volumes
echo "🐳 Removing Docker containers and volumes..."
docker-compose down -v 2>/dev/null || true

# Clean up log files
echo "📝 Cleaning up log files..."
rm -rf logs/

# Clean up Python cache
echo "🐍 Cleaning up Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Clean up Node.js cache
echo "📦 Cleaning up Node.js cache..."
rm -rf node_modules/.cache/ 2>/dev/null || true

echo "✅ Development environment cleaned"
echo ""
echo "💡 To start fresh:"
echo "   npm run setup    # Full setup with dependencies"
echo "   npm start        # Quick start (if already set up)"
