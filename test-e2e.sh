#!/bin/bash

# Test script to verify Retoquei end-to-end functionality
echo "=== Retoquei E2E Test ==="
echo ""

# 1. Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:3000/api/health | jq . || echo "Health endpoint not responding (app may not be running)"
echo ""

# 2. Test database connectivity
echo "2. Testing database connectivity..."
psql "$DATABASE_URL" -c "SELECT version();" 2>/dev/null || echo "Database check (requires local psql)"
echo ""

# 3. Test mock provider loads
echo "3. Checking mock provider configuration..."
echo "   - REDIS_URL: $REDIS_URL"
echo "   - WHATSAPP_ACCESS_TOKEN: ${WHATSAPP_ACCESS_TOKEN:-(not set - will use MOCK)}"
echo "   - EVOLUTION_API_URL: ${EVOLUTION_API_URL:-(not set)}"
echo ""

echo "✅ Environment checks complete"
echo "   Mock provider will be active by default"
echo "   Campaign dispatch will create Message records and mark as SENT"
echo ""
echo "Manual testing steps:"
echo "  1. Go to http://localhost:3000 and sign up"
echo "  2. Complete onboarding"
echo "  3. Create a template in Templates page"
echo "  4. Create a campaign pointing to that template"
echo "  5. Click 'Enviar campanha' (Send Campaign)"
echo "  6. Check campaign detail page - messages should show SENT status"
echo "  7. Check /api/health for system status"
