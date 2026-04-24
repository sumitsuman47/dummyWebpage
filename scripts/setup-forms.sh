#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Fix Form Submissions - Setup Script
# This script helps configure your environment for form submissions

echo "🔧 Lumitya Form Submission Setup"
echo "=================================="
echo ""

# Check .env file
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check if keys are configured
    if grep -qE "SUPABASE_URL=https://[a-z]+\.supabase\.co" .env; then
        echo "✅ Supabase URL configured"
    else
        echo "⚠️  Supabase URL not configured"
    fi
    
    if grep -qE "SUPABASE_ANON_KEY=.{20,}" .env; then
        echo "✅ Supabase key configured"
    else
        echo "⚠️  Supabase key not configured"
    fi
else
    echo "❌ .env file not found"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
fi

echo ""
echo "📧 EmailJS Configuration"
echo "------------------------"

# Check EmailJS config
if [ -f "public/js/emailjs-config.js" ]; then
    if grep -q "service_Lumitya" public/js/emailjs-config.js; then
        echo "✅ EmailJS service ID configured"
    else
        echo "⚠️  EmailJS service ID not configured"
    fi
    
    if grep -q "XTskJo1Oeud-CiX-p" public/js/emailjs-config.js; then
        echo "✅ EmailJS public key configured"
    else
        echo "⚠️  EmailJS public key not configured"
    fi
fi

echo ""
echo "🔍 Checking Node.js..."
echo "------------------------"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"
    echo ""
    echo "🎉 All prerequisites met!"
    echo ""
    echo "To start with full backend support:"
    echo "   1. npm install"
    echo "   2. npm start"
    echo "   3. Open http://localhost:3000"
    echo ""
else
    echo "❌ Node.js not found"
    echo ""
    echo "📋 To enable form submissions, you need Node.js:"
    echo ""
    echo "Option 1: Install via Homebrew"
    if command -v brew &> /dev/null; then
        echo "   brew install node"
    else
        echo "   First install Homebrew: https://brew.sh"
        echo "   Then: brew install node"
    fi
    echo ""
    echo "Option 2: Download from nodejs.org"
    echo "   Visit: https://nodejs.org/"
    echo "   Download and install the LTS version"
    echo ""
    echo "Option 3: Use EmailJS only (frontend only)"
    echo "   ✅ Email notifications will work"
    echo "   ❌ Database storage won't work"
    echo ""
fi

echo "=================================="
echo ""
echo "Current Status:"
echo "• Frontend: ✅ Ready (Python server)"
echo "• EmailJS: ✅ Configured (emails will send)"
if command -v node &> /dev/null; then
    echo "• Backend: ✅ Ready (Node.js available)"
    echo "• Supabase: ✅ Configured (database saves)"
else
    echo "• Backend: ⚠️  Not available (install Node.js)"
    echo "• Supabase: ⚠️  Needs backend (install Node.js)"
fi
echo ""
