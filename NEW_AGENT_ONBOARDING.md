# New Agent Onboarding Guide

Welcome to the team! This guide will help you get started as a new agent in the RRC project.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Agent Registration](#agent-registration)
3. [Understanding the Tools](#understanding-the-tools)
4. [Communication with Other Agents](#communication-with-other-agents)
5. [Task Management](#task-management)
6. [Common Workflows](#common-workflows)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:
- Access to the project repository
- The necessary tools installed (Bun, Python via uv, etc.)
- Understanding of the project stack:
  * Languages & Runtimes: Bun (JavaScript/TypeScript), Python (via uv), Rust (if needed)
  * Key Tools: Beads (`bd`), UBS (`ubs`), Agent Mail (`am_*`), CASS (`cass`), BV

## Agent Registration

Follow these steps to register your agent:

1. Check that the Agent Mail server is running:
   ```bash
   ps aux | grep mcp_agent_mail
   ```
   If not running, start it with:
   ```bash
   uv run python -m mcp_agent_mail.cli serve-http
   ```

2. Register your agent using the provided script:
   ```bash
   ./register_agent.sh "YourAgentName" "model-id" "/absolute/path/to/project"
   ```
   
   Note: Agent names must follow the `AdjectiveNoun` format (e.g., `WhiteHill`, `GreenLake`).

3. Verify your registration:
   ```bash
   ./verify_agent_mail.sh
   ```

## Understanding the Tools

### Beads (bd) - Task Tracking
Beads is the primary task tracking system. Key commands:
- `bd ready` - Find available work
- `bd show <id>` - View issue details
- `bd update <id> --status in_progress` - Claim work
- `bd close <id>` - Complete work

### UBS - Bug Scanning
Always run UBS before committing:
```bash
ubs $(git diff --cached --name-only)
```

### Agent Mail - Multi-Agent Coordination
Used for communication between agents. See the AGENT_MAIL_GUIDE.md for detailed instructions.

### BV - Planning & Triage
Get task recommendations:
```bash
bv --robot-triage | jq '.recommendations[0:3]'
```

## Communication with Other Agents

Agents communicate through the Agent Mail system:

1. Check your inbox regularly:
   ```bash
   am_inbox "YourAgentName"
   ```

2. Send messages to other agents:
   ```bash
   am_send "YourAgentName" "RecipientAgent" "Subject" "Message body"
   ```

3. Important: Broadcast to "All" is not supported. You must specify recipient agent names.

## Task Management

### Finding Work
1. Check recommended tasks:
   ```bash
   bv --robot-triage
   ```

2. View ready tasks:
   ```bash
   bd ready
   ```

### Claiming Work
1. Pick a task (use BV recommendations)
2. Claim it:
   ```bash
   TASK_ID="bd-X"
   bd update $TASK_ID --status in_progress
   ```

3. Reserve files you'll edit (REQUIRED for multi-agent):
   ```bash
   am_reserve "YourAgentName" "src/**,tests/**" 3600 true
   ```

4. Announce to other agents:
   ```bash
   am_send "YourAgentName" "All" "Working on $TASK_ID" "I'm starting work on: [description]"
   ```

### Completing Work
1. Release file reservations:
   ```bash
   am_release "YourAgentName" "src/**,tests/**"
   ```

2. Close the bead with details:
   ```bash
   bd close $TASK_ID --reason "Completed: [what you did]"
   ```

3. Notify other agents:
   ```bash
   am_send "YourAgentName" "All" "Completed $TASK_ID" "Task complete. Changed files: [list]"
   ```

## Common Workflows

### Before ANY Commit
1. Run UBS on changed files
2. Fix all UBS issues
3. Review the diff: `git diff --cached`
4. Write descriptive commit message

### File Reservation Rules
REQUIRED when:
- Editing any file another agent might touch
- Refactoring shared modules
- Changing interfaces/types

NOT REQUIRED when:
- Creating new files in your own feature branch
- Editing documentation
- Read-only operations

## Best Practices

1. Follow Code Quality Standards:
   - TypeScript/JavaScript: Use strict mode, avoid `any` types, prefer functional patterns
   - Python: Use type hints, follow PEP 8 style, use `uv` for dependency management

2. Communication:
   ALWAYS send messages when:
   - Starting work on a task
   - Completing a task
   - Discovering a blocker
   - Finding a bug that affects others
   - Changing shared interfaces/APIs

3. Absolute Rule: NO DELETIONS WITHOUT EXPLICIT PERMISSION
   - You may NOT delete any file or directory unless explicitly given permission
   - Forbidden without explicit approval: `git reset --hard`, `git clean -fd`, `rm -rf`

## Troubleshooting

### Agent Mail Issues
1. If Agent Mail appears offline:
   - Check process is running: `ps aux | grep mcp_agent_mail`
   - Verify port 8765 is listening: `ss -tlnp | grep 8765`

2. Common errors:
   - "Not Found" (404): Ensure you are POSTing to `/mcp/`, not `/agent/` or root
   - Validation Error: Use correct parameter names (`name` instead of `agent_name`, `project_key` instead of `project_slug`)

Remember: Agent Mail uses MCP protocol, not REST API. Direct curl commands to Agent Mail endpoints will return "Not Found" - this is expected behavior, not a server failure.