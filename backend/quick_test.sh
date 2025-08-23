#!/bin/bash

# Quick test script for flows API
# Usage: ./quick_test.sh

echo "🚀 Testing Flows API Endpoints"
echo "================================"

# Test server health
echo -e "\n📍 Checking server status..."
STATUS=$(curl -s http://localhost:8000/)
if [[ $STATUS == *"Tzelem Backend"* ]]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Start it with:"
    echo "   cd /Users/aaron/Documents/tzelem/backend"
    echo "   uv run uvicorn main:app --reload --port 8000"
    exit 1
fi

# Create a test flow
echo -e "\n📝 Creating a test flow..."
FLOW_ID="test-$(date +%s)"
RESPONSE=$(curl -s -X POST http://localhost:8000/api/flows \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$FLOW_ID\",
    \"name\": \"Quick Test Flow\",
    \"description\": \"Created at $(date)\",
    \"paradigm\": \"Agentic\",
    \"nodes\": [],
    \"edges\": [],
    \"version\": \"0.1.0\"
  }")

echo "Response: $RESPONSE"

# Extract flowId from response
if [[ $RESPONSE == *"flowId"* ]]; then
    echo "✅ Flow created successfully"
    
    # Retrieve the flow
    echo -e "\n🔍 Retrieving the created flow..."
    FLOW_DATA=$(curl -s http://localhost:8000/api/flows/$FLOW_ID)
    echo "$FLOW_DATA" | jq '.name, .description'
    echo "✅ Flow retrieved successfully"
else
    echo "❌ Failed to create flow"
fi

echo -e "\n✨ Test complete!"