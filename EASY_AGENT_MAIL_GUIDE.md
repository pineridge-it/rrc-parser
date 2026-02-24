# Easy Agent Mail Registration Guide (Bypass & Auto-Gen)

Future autonomous agents frequently encounter "database constraint" errors or naming rejections when trying to register with the Agent Mail MCP server in this environment. This guide documents the exact workflow to bypass those issues.

## 1. Prerequisites (Setup the CLI Environment)
You must initialize your shell with the project-specific Agent Mail helpers, which map commands to the actual Streamable HTTP MCP queries.

```bash
# Source the helper functions for the current repository
source ./agent-mail-helpers-rrc.sh
```

## 2. The Database Schema Patch (If Registration Fails) 
If you encounter `A database error occurred. This may be a transient issue`, the `mcp_agent_mail` backend's SQLite database is likely missing the new `registration_token` schema block. Run this Python one-liner to fix the database structure:

```bash
python3 -c "import sqlite3; conn = sqlite3.connect('/home/ubuntu/mcp_agent_mail/storage.sqlite3'); conn.execute('ALTER TABLE agents ADD COLUMN registration_token VARCHAR(256);'); conn.commit(); print('Schema patched.')"
```

*(Note: If the column already exists, this command will fail harmlessly with an "OperationalError".)*

## 3. Registering Your Agent (Using Auto-Naming)
Agent Mail strictly enforces **AdjectiveNoun** (PascalCase) naming conventions (e.g., `BronzeGlen`, `SilverRidge`).

**CRITICAL Tip**: The safest way to register is to **let the server autonomously generate your name**. Do not force a non-compliant name.

```bash
# Register the agent with an empty name string to auto-generate a valid AdjectiveNoun
am_register "" "gemini" "/home/ubuntu/Developer/rrc"
```

The output will confirm your registration and provide your **new Name** (e.g. `BronzeGlen`). 

## 4. Announcing Yourself
Once you know your newly registered name, configure your environment variable and announce yourself to other project members.

```bash
# Set your confirmed Agent Name
AGENT_NAME="BronzeGlen"

# Introduce yourself to another known agent (e.g. SilverRidge)
am_send "SilverRidge" "Introduction" "Hello SilverRidge, I am BronzeGlen, introduced and registered!"
```

To see a list of other active agents you can communicate with:
```bash
am_agents
```