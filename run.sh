#!/bin/bash

# Lumitya Platform - Quick Start Script
# ======================================

echo "🚀 Starting Lumitya Platform..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Install it with: brew install node"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "✓ Please update .env with your actual credentials"
    echo ""
fi

# Kill any existing server on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "🔄 Stopping existing server on port 3000..."
    kill -9 $(lsof -ti:3000)
    sleep 1
fi

# Start the server
echo "✨ Starting backend server on http://localhost:3000"
node server/index.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend server is running (PID: $SERVER_PID)"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 Lumitya is ready!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📱 Open in browser: http://localhost:3000"
    echo ""
    echo "Available endpoints:"
    echo "  • Homepage:          http://localhost:3000"
    echo "  • Service Request:   http://localhost:3000/api/requests"
    echo "  • Contractor Apply:  http://localhost:3000/api/providers"
    echo "  • Provider List:     http://localhost:3000/api/providers"
    echo ""
    echo "To stop the server:"
    echo "  kill $SERVER_PID"
    echo "  or: pkill -f 'node server/index.js'"
    echo ""
    
    # Open browser
    sleep 1
    open http://localhost:3000
else
    echo "❌ Server failed to start"
    echo "Check the logs for errors"
    exit 1
fi
