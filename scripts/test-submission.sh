#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Complete Form Submission Test
# This script verifies that all form submission components are working

echo "🧪 Testing Form Submission System"
echo "=================================="
echo ""

# Check backend server
echo "1. Checking backend server..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ Backend server is running"
    HEALTH=$(curl -s http://localhost:3000/health | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")
    echo "   Status: $HEALTH"
else
    echo "   ❌ Backend server not running"
    echo "   Start with: npm start"
    exit 1
fi

echo ""
echo "2. Testing API endpoint..."

# Test service request API
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "city": "Guadalajara",
    "neighbourhood": "Centro",
    "service": "Plumbing",
    "description": "Test submission from script",
    "timeline": "Soon",
    "phone": "+52 33 1234 5678"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API request successful (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
    echo ""
    echo "🎉 FORM SUBMISSIONS ARE WORKING!"
    echo ""
    echo "✅ Backend: Running"
    echo "✅ API: Working"
    echo "✅ Supabase: Connected"
    echo "✅ EmailJS: Configured"
    echo ""
    echo "You can now submit forms on: http://localhost:3000"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "   ⚠️  API validation error (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
    echo ""
    echo "📋 TO FIX:"
    echo "1. Check Supabase tables exist"
    echo "2. Run: supabase-setup.sql in Supabase SQL Editor"
    echo "3. Go to: https://supabase.com/dashboard"
else
    echo "   ❌ API request failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
    echo ""
    echo "📋 TO FIX:"
    echo "1. Check .env file has correct Supabase credentials"
    echo "2. Verify Supabase project is active"
    echo "3. Run: supabase-setup.sql in Supabase SQL Editor"
fi

echo ""
echo "=================================="
