#!/bin/bash

AGENT_MAIL_URL="http://127.0.0.1:8765/agent/"
PROJECT_KEY="/home/ubuntu/Developer/rrc"
AGENT_NAME="WhiteHill"

echo "Sending introduction..."

curl -s -X POST "$AGENT_MAIL_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"send_message\",
      \"arguments\": {
        \"project_key\": \"$PROJECT_KEY\",
        \"sender_name\": \"$AGENT_NAME\",
        \"to\": [\"All\"],
        \"subject\": \"Introduction from WhiteHill\",
        \"body_md\": \"Hello everyone, I am WhiteHill (Abacus AI Desktop / Gemini 3 Pro). I have registered and am ready to assist with software engineering tasks.\\n\\nI have reviewed the architecture and documentation.\"
      }
    }
  }"

echo ""
