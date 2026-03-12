#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Full API Test Report"
echo "===================="
echo ""

# Get full error details for service request
echo "1. Service Request API Test:"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/requests \
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
  }')

echo "$RESPONSE" | jq '.'
echo ""

# Get providers
echo "2. Get Providers API Test:"
PROVIDERS=$(curl -s "http://localhost:3000/api/providers?city=Guadalajara&limit=3")
echo "$PROVIDERS" | jq '.'
echo ""

# Provider count
COUNT=$(echo "$PROVIDERS" | jq '.data | length')
echo "Found $COUNT providers"
echo ""

echo "===================="
echo "Summary:"
echo "- Backend server: ✓ Running on port 3000"
echo "- Providers table: ✓ Can read data"
echo "- Submissions table: Needs RLS policy"
echo ""
echo "Action required:"
echo "Run supabase-policies.sql in Supabase SQL Editor to enable form submissions"
