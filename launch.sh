#!/bin/bash

# Lumitya Platform - Quick Launch Script
# This script starts the website using Python's built-in server (no Node.js required)

echo "🚀 Lumitya Platform - Quick Launch"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "public/index.html" ]; then
    echo "❌ Error: public/index.html not found"
    echo "   Please run this script from the lumitya-optimized directory"
    exit 1
fi

# Check for Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python not found"
    echo "   Please install Python 3 to run this script"
    exit 1
fi

# Get the port (default 3000)
PORT=${1:-3000}

echo "✅ Found Python: $PYTHON_CMD"
echo "📁 Serving files from: public/"
echo "🌐 Starting web server on port $PORT..."
echo ""
echo "   👉 Open in browser: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="
echo ""

# Change to public directory and start server
cd public && $PYTHON_CMD -m http.server $PORT

echo ""
echo "Server stopped."
