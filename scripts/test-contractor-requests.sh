#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Testing Contractor Join Request Form"
echo "====================================="
echo ""

# Test 1: Basic contractor application
echo "Test 1: Basic Contractor Application"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Roberto Sánchez",
    "phone": "3312345678",
    "email": "roberto@example.com",
    "title_en": "Electrician",
    "title_es": "Electricista",
    "services": ["electricidad", "instalaciones"],
    "city": "Guadalajara",
    "neighbourhood": "Chapalita",
    "years_experience": "8",
    "description": "Especialista en instalaciones eléctricas residenciales y comerciales",
    "tags_en": ["licensed", "24/7 service"],
    "tags_es": ["licenciado", "servicio 24/7"]
  }')

echo "$RESPONSE" | jq '.'
echo ""

# Test 2: Contractor with auto-generated initials
echo "Test 2: Contractor Application (auto-generated initials)"
RESPONSE2=$(curl -s -X POST http://localhost:3000/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana María González",
    "phone": "3398765432",
    "email": "ana.gonzalez@example.com",
    "title_en": "Interior Designer",
    "title_es": "Diseñadora de Interiores",
    "services": ["diseño", "decoración"],
    "city": "Guadalajara",
    "neighbourhood": "Providencia",
    "years_experience": "6",
    "color": "#E91E63",
    "description": "Diseño de interiores modernos y minimalistas"
  }')

echo "$RESPONSE2" | jq '.'
echo ""

echo "====================================="
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✓ Contractor join request form is working!"
  echo ""
  echo "Admin workflow:"
  echo "1. Review applications in contractor_join_requests table"
  echo "2. Verify contractor ID (set id_checked = true)"
  echo "3. Approve (set move_to_provider_list = true)"
  echo "4. Trigger automatically moves them to providers table"
else
  echo "✗ Contractor application submission failed"
  echo ""
  echo "Next step: Run supabase-contractor-requests.sql in Supabase SQL Editor"
fi
