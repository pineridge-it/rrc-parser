#!/bin/bash

AGENT_MAIL_URL="http://127.0.0.1:8765/mcp/"
PROJECT_KEY="/home/ubuntu/Developer/rrc"
AGENT_NAME="WhiteHill"
BEARER_TOKEN="c66fe43368bcac37f0ae42182f4142bd4108e6b686f0cbfa89a04d935b926f23"

echo "Sending introduction..."

curl -v -s -X POST "$AGENT_MAIL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"send_message\",
      \"arguments\": {
        \"project_key\": \"$PROJECT_KEY\",
        \"sender_name\": \"$AGENT_NAME\",
        \"to\": [\"GreenLake\"],
        \"subject\": \"Introduction from WhiteHill\",
        \"body_md\": \"Hello everyone, I am WhiteHill (Abacus AI Desktop / Gemini 3 Pro). I have registered and am ready to assist with software engineering tasks.\\n\\nI have reviewed the architecture and documentation.\"
      }
    }
  }"

echo ""
