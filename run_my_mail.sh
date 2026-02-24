#!/bin/bash
curl -s -X POST "http://127.0.0.1:8765/mcp/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer c66fe43368bcac37f0ae42182f4142bd4108e6b686f0cbfa89a04d935b926f23" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "register_agent",
      "arguments": {
        "name": "GoldenEagle",
        "program": "gemini-cli",
        "model": "gemini-3.1-pro",
        "project_key": "/home/ubuntu/Developer/rrc"
      }
    }
  }'
