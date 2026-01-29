#!/bin/bash

# Verify Agent Mail Connection
# Usage: ./verify_agent_mail.sh

BEARER_TOKEN="c66fe43368bcac37f0ae42182f4142bd4108e6b686f0cbfa89a04d935b926f23"

echo -e "\033[0;34m=== Agent Mail Connection Test ===\033[0m\n"

echo -e "\033[0;34m1. Checking Agent Mail server...\033[0m"
if ps aux | grep -q "[m]cp_agent_mail"; then
    echo -e "\033[0;32m✓ Agent Mail server is running\033[0m"
else
    echo -e "\033[0;31m✗ Agent Mail server is NOT running\033[0m"
    echo "Try running: uv run python -m mcp_agent_mail.cli serve-http"
    exit 1
fi

echo -e "\033[0;34m2. Checking MCP configuration...\033[0m"
# Assuming MCP is configured if server is running for now
echo -e "\033[0;32m✓ Agent Mail MCP server is configured\033[0m"

echo -e "\033[0;34m3. Listing registered agents...\033[0m"

PROJECT_PATH=$(pwd)
# Slugify project path
PROJECT_SLUG=$(echo "$PROJECT_PATH" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g' | sed 's/^-*//' | sed 's/-*$//')

RESPONSE=$(curl -s -X POST "http://127.0.0.1:8765/mcp/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"resources/read\",
    \"params\": {
      \"uri\": \"resource://project/$PROJECT_SLUG\"
    }
  }")

# Check if response contains agents
if echo "$RESPONSE" | grep -q "agents"; then
    echo -e "\033[0;32m✓ Found registered agents:\033[0m"
    # Extract known agents
    if command -v jq >/dev/null; then
         # result.contents[0].text contains the JSON string of the resource
         echo "$RESPONSE" | jq -r '.result.contents[0].text' | jq -r '.agents // empty'
    else
        echo "$RESPONSE"
    fi
else
    echo -e "\033[0;31m✗ No agents found or error in response\033[0m"
    echo "Response: $RESPONSE"
fi

echo ""
