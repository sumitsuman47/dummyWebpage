#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Testing Service Request Form with New Schema"
echo "============================================="
echo ""

# Test 1: Basic service request
echo "Test 1: Basic Service Request"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "3312345678",
    "city": "Guadalajara",
    "neighbourhood": "Providencia",
    "service": "Plomería",
    "description": "Necesito reparar una fuga de agua en el baño",
    "budget": "1000-2000",
    "timeline": "2026-03-15"
  }')

echo "$RESPONSE" | jq '.'
echo ""

# Test 2: Service request with provider targeting
echo "Test 2: Service Request for Specific Provider"
RESPONSE2=$(curl -s -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María García",
    "email": "maria@example.com",
    "phone": "3398765432",
    "city": "Guadalajara",
    "neighbourhood": "Zapopan Centro",
    "service": "Carpintería",
    "description": "Necesito muebles personalizados para la sala",
    "budget": "5000-8000",
    "timeline": "2026-03-20",
    "provider_id": 6,
    "provider_name": "Ricardo López"
  }')

echo "$RESPONSE2" | jq '.'
echo ""

echo "============================================="
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✓ Service request form is working!"
else
  echo "✗ Service request submission failed"
  echo ""
  echo "Next step: Run supabase-service-requests.sql in Supabase SQL Editor"
fi
