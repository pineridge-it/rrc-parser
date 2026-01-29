#!/bin/bash

PROJECT_PATH="$1"
AGENT_MAIL_URL="${2:-http://127.0.0.1:8765/mcp/}"
BEARER_TOKEN="${3:-c66fe43368bcac37f0ae42182f4142bd4108e6b686f0cbfa89a04d935b926f23}"

if [ -z "$PROJECT_PATH" ]; then
    echo "Usage: $0 \"/absolute/path/to/project\""
    exit 1
fi

echo "Ensuring project exists: $PROJECT_PATH"

curl -s -X POST "$AGENT_MAIL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"ensure_project\",
      \"arguments\": {
        \"human_key\": \"$PROJECT_PATH\"
      }
    }
  }"

echo ""
