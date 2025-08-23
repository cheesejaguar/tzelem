# Flow API Test Commands

## 1. POST - Create/Update Flow

### Basic curl command:
```bash
curl -X POST http://localhost:8000/api/flows \
  -H "Content-Type: application/json" \
  -d '{"id":"test-flow-001","name":"Test Flow","paradigm":"Agentic","nodes":[],"edges":[],"version":"0.1.0"}'
```

### Pretty-printed with jq:
```bash
curl -X POST http://localhost:8000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-flow-001",
    "name": "Test Flow",
    "description": "A simple test flow",
    "paradigm": "Sequential",
    "nodes": [],
    "edges": [],
    "version": "0.1.0"
  }' | jq '.'
```

### Full example with all fields:
```bash
curl -X POST http://localhost:8000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "id": "advanced-flow-001",
    "name": "Advanced Multi-Agent Flow",
    "description": "Complex workflow with multiple agents",
    "paradigm": "Agentic",
    "version": "0.1.0",
    "nodes": [
      {
        "id": "node-1",
        "type": "master",
        "position": {"x": 100, "y": 100},
        "data": {"label": "Master Agent", "model": "gpt-4"}
      },
      {
        "id": "node-2",
        "type": "execution",
        "position": {"x": 300, "y": 100},
        "data": {"label": "Worker Agent", "task": "data_processing"}
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "type": "default"
      }
    ],
    "metadata": {
      "tags": ["production", "data-pipeline"],
      "owner": "data-team",
      "cost_limit": 10.0
    }
  }' | jq '.'
```

## 2. GET - Retrieve Flow by ID

```bash
# Get a specific flow
curl -X GET http://localhost:8000/api/flows/test-flow-001 | jq '.'

# With headers for debugging
curl -X GET http://localhost:8000/api/flows/test-flow-001 \
  -H "Accept: application/json" \
  -v | jq '.'
```

## 3. GET - List All Flows

```bash
# List all flows
curl -X GET http://localhost:8000/api/flows | jq '.'

# With pagination (if implemented in future)
curl -X GET "http://localhost:8000/api/flows?limit=10&offset=0" | jq '.'
```

## 4. Testing with HTTPie (alternative to curl)

If you have HTTPie installed, it's more user-friendly:

```bash
# POST a flow
http POST localhost:8000/api/flows \
  id="test-flow-002" \
  name="HTTPie Test Flow" \
  paradigm="Sequential" \
  nodes:='[]' \
  edges:='[]' \
  version="0.1.0"

# GET a flow
http GET localhost:8000/api/flows/test-flow-002

# List flows
http GET localhost:8000/api/flows
```

## 5. Test Error Handling

### Invalid JSON:
```bash
curl -X POST http://localhost:8000/api/flows \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

### Missing required fields:
```bash
curl -X POST http://localhost:8000/api/flows \
  -H "Content-Type: application/json" \
  -d '{"name": "Missing Required Fields"}'
```

### Non-existent flow:
```bash
curl -X GET http://localhost:8000/api/flows/non-existent-flow-id
```

## 6. Running the Backend Server

Before testing, make sure the backend is running:

```bash
cd /Users/aaron/Documents/tzelem/backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 7. Batch Testing Script

Save this as `test_all_endpoints.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:8000/api/flows"

echo "1. Creating a new flow..."
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "batch-test-flow",
    "name": "Batch Test Flow",
    "paradigm": "Agentic",
    "nodes": [],
    "edges": [],
    "version": "0.1.0"
  }' | jq '.'

echo -e "\n2. Retrieving the created flow..."
curl -s -X GET $API_URL/batch-test-flow | jq '.'

echo -e "\n3. Listing all flows..."
curl -s -X GET $API_URL | jq '.'

echo -e "\n4. Updating the flow..."
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "id": "batch-test-flow",
    "name": "Updated Batch Test Flow",
    "description": "This flow has been updated",
    "paradigm": "Sequential",
    "nodes": [{"id": "new-node", "type": "master"}],
    "edges": [],
    "version": "0.2.0"
  }' | jq '.'

echo -e "\n5. Verifying the update..."
curl -s -X GET $API_URL/batch-test-flow | jq '.name, .paradigm, .version'
```

## Notes

- Replace `localhost:8000` with your actual backend URL if different
- The API expects JSON with specific fields as defined in the `FlowData` model
- All responses are in JSON format
- The flow ID in the URL for GET requests should match the `id` field in the flow data
- Flows are stored in Convex database at `scintillating-ptarmigan-513.convex.cloud`