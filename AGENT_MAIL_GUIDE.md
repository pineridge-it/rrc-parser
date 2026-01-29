# Agent Mail Comprehensive Guide

This guide documents the operational procedures, commands, and troubleshooting steps for using MCP Agent Mail in this environment. It reflects the latest findings regarding tool schemas and script fixes.

## 1. System Overview

Agent Mail is an MCP (Model Context Protocol) server that facilitates coordination between autonomous coding agents.

*   **Protocol**: Streamable HTTP using JSON-RPC 2.0.
*   **Endpoint**: `http://127.0.0.1:8765/mcp/`
*   **Auth**: Requires Bearer token (default: `c66fe43368bcac37f0ae42182f4142bd4108e6b686f0cbfa89a04d935b926f23`).
*   **Identity**: Agents are identified by `AdjectiveNoun` names (e.g., `WhiteHill`, `GreenLake`).

## 2. Standard Workflow

### Step 1: Pre-Flight Check
Ensure the Agent Mail server is running.
```bash
ps aux | grep mcp_agent_mail
# If not running:
# uv run python -m mcp_agent_mail.cli serve-http
```

### Step 2: Ensure Project Exists
Before registering an agent, the project context must be established. This is idempotent.

**Via Script:**
```bash
./ensure_project.sh "/absolute/path/to/project"
```

**Via MCP Tool (`ensure_project`):**
```json
{
  "name": "ensure_project",
  "arguments": {
    "human_key": "/absolute/path/to/project"
  }
}
```

### Step 3: Register Agent
Register your agent session. If you provide a name, it must be in `AdjectiveNoun` format. If omitted, the server generates one.

**Via Script:**
```bash
# Usage: ./register_agent.sh <DesiredName> <ModelID> <ProjectPath>
./register_agent.sh WhiteHill gemini /home/ubuntu/Developer/rrc
```

**Via MCP Tool (`register_agent`):**
```json
{
  "name": "register_agent",
  "arguments": {
    "name": "WhiteHill",       // Optional: omit to auto-generate
    "program": "gemini",
    "model": "gemini",
    "project_key": "/home/ubuntu/Developer/rrc"
  }
}
```

### Step 4: Verification
Verify that your agent is listed and the server is responding correctly.

**Via Script:**
```bash
./verify_agent_mail.sh
```

## 3. Communication

### Sending Messages
**Note**: Broadcasting to "All" is **not supported**. You must specify recipient agent names.

**Via MCP Tool (`send_message`):**
```json
{
  "name": "send_message",
  "arguments": {
    "project_key": "/home/ubuntu/Developer/rrc",
    "sender_name": "WhiteHill",
    "to": ["GreenLake"],
    "subject": "Task Update",
    "body_md": "I have completed the task."
  }
}
```

### Reading Inbox
To check for incoming messages, use the `fetch_inbox` tool or read the `inbox` resource.

**Via MCP Tool (`fetch_inbox`):**
```json
{
  "name": "fetch_inbox",
  "arguments": {
    "agent_name": "WhiteHill",
    "project_key": "/home/ubuntu/Developer/rrc",
    "unread_only": true
  }
}
```

## 4. File Reservations
To prevent conflicts, agents should reserve files before editing.

### Reserving Files
**Via MCP Tool (`file_reservation_paths`):**
```json
{
  "name": "file_reservation_paths",
  "arguments": {
    "project_key": "/home/ubuntu/Developer/rrc",
    "agent_name": "WhiteHill",
    "paths": ["dist/**", "src/parser.ts"]
  }
}
```

### Releasing Files
**Via MCP Tool (`release_file_reservations`):**
```json
{
  "name": "release_file_reservations",
  "arguments": {
    "project_key": "/home/ubuntu/Developer/rrc",
    "agent_name": "WhiteHill",
    "paths": ["src/parser.ts"] 
  }
}
```

## 5. Troubleshooting & Pitfalls

### Common Errors

1.  **"Not Found" (404)**
    *   **Cause**: Using the wrong URL endpoint.
    *   **Fix**: Ensure you are POSTing to `/mcp/`, not `/agent/` or root.
    *   **Correct**: `http://127.0.0.1:8765/mcp/`

2.  **Validation Error: `unexpected_keyword_argument`**
    *   **Cause**: Using outdated parameter names in tool calls.
    *   **Fix**:
        *   Use `name` instead of `agent_name` in `register_agent`.
        *   Use `project_key` instead of `project_slug`.
        *   Use `human_key` in `ensure_project`.

3.  **Example: `register_agent` Schema Mismatch**
    *   ❌ Incorrect: `{"agent_name": "..."}`
    *   ✅ Correct: `{"name": "..."}`

4.  **"Invalid recipient 'All'"**
    *   **Cause**: Trying to broadcast using `to: ["All"]`.
    *   **Fix**: List specific registered agent names found via `verify_agent_mail.sh`.

### Syntax Errors in Scripts
Original scripts in the repo had several issues:
*   `ensure_project.sh` was empty.
*   `verify_agent_mail.sh` had broken `sed` commands and unterminated strings.
*   **Solution**: Use the fixed versions provided below.

## 6. Functional Script Reference

### `ensure_project.sh` (Fixed)
```bash
#!/bin/bash
PROJECT_PATH="$1"
AGENT_MAIL_URL="${2:-http://127.0.0.1:8765/mcp/}"
BEARER_TOKEN="${3:-c66fe43368bcac37f0ae42182f4142bd4108e6b686f0cbfa89a04d935b926f23}"

if [ -z "$PROJECT_PATH" ]; then
    echo "Usage: $0 \"/absolute/path/to/project\""
    exit 1
fi

curl -s -X POST "$AGENT_MAIL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -d "{
    \"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"ensure_project\",
      \"arguments\": { \"human_key\": \"$PROJECT_PATH\" }
    }
  }"
echo ""
```

### `verify_agent_mail.sh` (Fixed)
```bash
#!/bin/bash
BEARER_TOKEN="c66fe43368bcac37f0ae42182f4142bd4108e6b686f0cbfa89a04d935b926f23"
PROJECT_PATH=$(pwd)
# Slugify project path logic...
PROJECT_SLUG=$(echo "$PROJECT_PATH" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/^-//' | sed 's/-$//')

echo "Checking for agents in: $PROJECT_SLUG"

RESPONSE=$(curl -s -X POST "http://127.0.0.1:8765/mcp/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -d "{
    \"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"resources/read\",
    \"params\": { \"uri\": \"resource://project/$PROJECT_SLUG\" }
  }")

if echo "$RESPONSE" | grep -q "agents"; then
    echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['contents'][0]['text'])" 
else
    echo "No agents found."
fi
```
