#!/bin/bash

# Test script for POST /api/flows endpoint

# Example flow JSON that matches the FlowData schema
curl -X POST http://localhost:8000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "id": "flow-test-001",
    "name": "Customer Support Flow",
    "description": "AI-powered customer support workflow",
    "paradigm": "Agentic",
    "version": "0.1.0",
    "nodes": [
      {
        "id": "master-1",
        "type": "master",
        "position": {"x": 100, "y": 100},
        "data": {
          "label": "Master Orchestrator",
          "config": {
            "model": "gpt-4",
            "temperature": 0.7
          }
        }
      },
      {
        "id": "router-1",
        "type": "routing",
        "position": {"x": 300, "y": 100},
        "data": {
          "label": "Intent Router",
          "routes": ["billing", "technical", "general"]
        }
      },
      {
        "id": "exec-1",
        "type": "execution",
        "position": {"x": 500, "y": 50},
        "data": {
          "label": "Billing Agent",
          "specialization": "billing_support"
        }
      },
      {
        "id": "exec-2",
        "type": "execution",
        "position": {"x": 500, "y": 150},
        "data": {
          "label": "Technical Agent",
          "specialization": "technical_support"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "master-1",
        "target": "router-1",
        "type": "default"
      },
      {
        "id": "edge-2",
        "source": "router-1",
        "target": "exec-1",
        "type": "conditional",
        "data": {"condition": "billing"}
      },
      {
        "id": "edge-3",
        "source": "router-1",
        "target": "exec-2",
        "type": "conditional",
        "data": {"condition": "technical"}
      }
    ],
    "metadata": {
      "author": "system",
      "tags": ["customer-support", "routing", "multi-agent"],
      "budget": {
        "max_tokens": 10000,
        "max_cost_usd": 5.0
      }
    }
  }' | jq '.'

# The response should be:
# {
#   "flowId": "flow-test-001"
# }