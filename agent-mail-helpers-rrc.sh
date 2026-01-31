#!/bin/bash

# Agent Mail Helpers for Abacus AI - RRC Project
# Source this file to get am_* functions

AGENT_MAIL_URL="http://127.0.0.1:8765/mcp/"
PROJECT_SLUG="home-ubuntu-developer-rrc"
PROJECT_KEY="/home/ubuntu/Developer/rrc"
AGENT_NAME="IvoryWaterfall"

# Register agent
am_register() {
    local agent_name="$1"
    local model="$2"
    local project_path="$3"
    if [ -z "$agent_name" ] || [ -z "$model" ] || [ -z "$project_path" ]; then
        echo "Usage: am_register <agent_name> <model> <project_path>"
        return 1
    fi
    local project_slug
    project_slug=$(echo "$project_path" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/^-//' | sed 's/-$//')
    curl -s -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": {\"name\": \"register_agent\", \"arguments\": {\"name\": \"$agent_name\", \"program\": \"abacusai\", \"model\": \"$model\", \"project_key\": \"$project_path\"}}}" "$AGENT_MAIL_URL"
}

# List agents (using resource)
am_agents() {
    curl -s -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"resources/read\", \"params\": {\"uri\": \"resource://project/$PROJECT_SLUG\"}}" "$AGENT_MAIL_URL" | jq -r '.result.contents[0].text' | jq '.agents'
}

# Check inbox
am_inbox() {
    local limit="${1:-10}"
    curl -s -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": {\"name\": \"fetch_inbox\", \"arguments\": {\"project_key\": \"$PROJECT_KEY\", \"agent_name\": \"$AGENT_NAME\"}}}" "$AGENT_MAIL_URL" | jq -r '.result.content[0].text'
}

# Reserve file
am_reserve() {
    local file_path="$1"
    if [ -z "$file_path" ]; then
        echo "Usage: am_reserve <file_path>"
        return 1
    fi
    curl -s -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": {\"name\": \"file_reservation_paths\", \"arguments\": {\"project_key\": \"$PROJECT_KEY\", \"agent_name\": \"$AGENT_NAME\", \"paths\": [\"$file_path\"]}}}" "$AGENT_MAIL_URL"
}

# Send message
am_send() {
    local recipient="$1"
    local subject="$2"
    local message="$3"
    if [ -z "$recipient" ] || [ -z "$message" ]; then
        echo "Usage: am_send <recipient> <subject> <message>"
        return 1
    fi
    curl -s -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": {\"name\": \"send_message\", \"arguments\": {\"project_key\": \"$PROJECT_KEY\", \"sender_name\": \"$AGENT_NAME\", \"to\": [\"$recipient\"], \"subject\": \"$subject\", \"body_md\": \"$message\"}}}" "$AGENT_MAIL_URL"
}

# Release file
am_release() {
    local file_path="$1"
    if [ -z "$file_path" ]; then
        echo "Usage: am_release <file_path>"
        return 1
    fi
    curl -s -X POST -H "Content-Type: application/json" -d "{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/call\", \"params\": {\"name\": \"release_file_reservations\", \"arguments\": {\"project_key\": \"$PROJECT_KEY\", \"agent_name\": \"$AGENT_NAME\", \"paths\": [\"$file_path\"]}}}" "$AGENT_MAIL_URL"
}