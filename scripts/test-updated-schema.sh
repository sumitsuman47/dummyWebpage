#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Testing updated schema with your Supabase structure..."
echo "=================================================="
echo ""

# Test service request submission
echo "1. Testing Service Request Submission..."
curl -s -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "city": "Guadalajara",
    "neighbourhood": "Providencia",
    "service": "Plomería",
    "description": "Need help with leaky faucet",
    "budget": "1000-2000",
    "timeline": "Esta semana",
    "phone": "3312345678",
    "email": "test@example.com"
  }' | jq -r '.success // .error'

echo ""

# Test provider application
echo "2. Testing Provider Application..."
curl -s -X POST http://localhost:3000/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Provider",
    "business_name": "Test Business",
    "phone": "3312345678",
    "email": "provider@example.com",
    "city": "Guadalajara",
    "neighbourhood": "Providencia",
    "services": ["Plomería", "Electricidad"],
    "years_experience": "5"
  }' | jq -r '.success // .error'

echo ""

# Test get providers
echo "3. Testing Get Providers..."
curl -s "http://localhost:3000/api/providers?city=Guadalajara&limit=5" | jq -r '.success // .error'

echo ""
echo "=================================================="
echo "Test complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project: qylfvajhihlxrpmztpou"
echo "3. Click 'SQL Editor'"
echo "4. Run the SQL script in: supabase-policies.sql"
echo "5. Your providers table already exists - just need to add RLS policies"
echo "6. After running the SQL, forms will save to submissions table"
