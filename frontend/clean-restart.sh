#!/bin/bash

echo "🧹 Cleaning Next.js cache and restarting frontend..."

# Stop any running Next.js processes
echo "Stopping any running Next.js processes..."
pkill -f "next dev" || true

# Remove Next.js cache and build artifacts
echo "Removing .next directory..."
rm -rf .next

# Remove node_modules cache
echo "Removing node_modules cache..."
rm -rf node_modules/.cache

# Remove npm cache (optional, but helps with corrupted packages)
echo "Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies to ensure clean state
echo "Reinstalling dependencies..."
rm -rf node_modules
rm -f package-lock.json
npm install

echo "✅ Clean restart complete! You can now run 'npm run dev'"
