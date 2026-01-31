# AGENTS.md — Agent Coordination & Rules

## ABSOLUTE RULE: NO DELETIONS WITHOUT EXPLICIT PERMISSION

You may **NOT delete any file or directory** unless I explicitly give the exact command **in this session**.

* This includes files you just created (tests, tmp files, scripts, etc.)

* You do not get to decide that something is "safe" to remove

* If you think something should be removed, **stop and ask**. You must receive clear written approval **before** any deletion command is even proposed

**Forbidden without explicit approval:**

* `git reset --hard`

* `git clean -fd`

* `rm -rf`

* Any command that can delete or overwrite code/data

**If unsure:** Ask first. Prefer safe tools: `git status`, `git diff`, `git stash`, copying to backups.

---

## Project Stack

**Languages & Runtimes:**

* Bun (JavaScript/TypeScript)

* Python (via uv)

* Rust (if needed)

**Key Tools:**

* Beads (`bd`) - Task tracking

* UBS (`ubs`) - Bug scanning before commits

* Agent Mail (`am_*`) - Multi-agent coordination

* CASS (`cass`) - Session search & memory

* BV - Planning & triage

**Coding Agents:**

* Abacus CLI with models: Sonnet, GPT, Gemini

* Aliases: `cc`, `cod`, `gmi`

---

## Agent Workflow

### 1\. Session Start

```bash
# Register with Agent Mail
source ~/.acfs/scripts/agent-mail-helpers.sh
am_register "YourAgentName" "abacusai" "sonnet"

# Check who else is active
am_agents

# Check inbox for messages
am_inbox "YourAgentName"
```

**Concrete Example:**
```bash
# Register a new agent named BlueOcean
source ~/.acfs/scripts/agent-mail-helpers.sh
am_register "BlueOcean" "abacusai" "sonnet"
# Output: Registered agent BlueOcean with project /home/ubuntu/Developer/rrc

# Check active agents
am_agents
# Output:
# Active agents in project rrc:
# - BlueOcean (registered 2026-01-27T10:30:00Z)
# - WhiteHill (registered 2026-01-27T09:15:00Z)
# - GreenLake (registered 2026-01-27T08:45:00Z)

# Check inbox
am_inbox "BlueOcean"
# Output: No unread messages
```

**Alternative Method (Direct API Call):**
```bash
# Register an agent using direct curl command
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "register_agent", "arguments": {"name": "BlueOcean", "program": "abacusai", "model": "sonnet", "project_key": "/home/ubuntu/Developer/rrc"}}}' \
  http://127.0.0.1:8765/mcp/
# Output: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"Registered agent BlueOcean"}]}}
```

### 2\. Getting Context

```bash
# Get CASS Memory context
~/cm-context-prompt.sh "your task description"

# Check task priorities
bv --robot-triage | jq '.recommendations[0:3]'

# Check ready tasks
bd ready --json
```

**Concrete Example:**
```bash
# Get context for implementing a new feature
~/cm-context-prompt.sh "implement user authentication"
# Output: Based on previous sessions, authentication should integrate with Supabase...

# Check task priorities
bv --robot-triage | jq '.recommendations[0:3]'
# Output:
# [
#   {
#     "id": "bd-15",
#     "title": "Implement user authentication",
#     "priority": 1,
#     "confidence": 0.95,
#     "reasoning": "Blocks 3 other features, high business value"
#   },
#   {
#     "id": "bd-12",
#     "title": "Fix memory leak in parser",
#     "priority": 0,
#     "confidence": 0.98,
#     "reasoning": "Critical performance issue affecting all users"
#   }
# ]

# Check ready tasks
bd ready --json
# Output:
# [
#   {
#     "id": "bd-15",
#     "title": "Implement user authentication",
#     "status": "ready",
#     "assigned_to": null,
#     "created_at": "2026-01-27T08:00:00Z"
#   },
#   {
#     "id": "bd-18",
#     "title": "Add error handling to API routes",
#     "status": "ready",
#     "assigned_to": null,
#     "created_at": "2026-01-27T09:30:00Z"
#   }
# ]
```

### 3\. Claiming Work

```bash
# Pick a task (use BV recommendations)
TASK_ID="bd-X"

# Claim it
bd update $TASK_ID --status in_progress

# Reserve files you'll edit (REQUIRED for multi-agent)
am_reserve "YourAgentName" "src/**,tests/**" 3600 true

# Announce to other agents
am_send "YourAgentName" "All" "Working on $TASK_ID" "I'm starting work on: [description]"
```

**Concrete Example:**
```bash
# Claim task bd-15 (implement user authentication)
TASK_ID="bd-15"
bd update $TASK_ID --status in_progress
# Output: Updated issue: bd-15

# Reserve files for editing
am_reserve "BlueOcean" "src/api/auth.*,src/components/Login.*,tests/auth.*" 3600 true
# Output: Reserved paths for BlueOcean: src/api/auth.*, src/components/Login.*, tests/auth.*

# Announce to other agents
am_send "BlueOcean" "All" "Working on bd-15" "I'm starting work on implementing user authentication with Supabase integration."
# Output: Message sent successfully
```

### 4\. During Work

**Check messages periodically:**

```bash
am_inbox "YourAgentName"
```

**Concrete Example:**
```bash
# Check inbox for messages
am_inbox "BlueOcean"
# Output:
# [
#   {
#     "from": "WhiteHill",
#     "to": ["BlueOcean"],
#     "subject": "Question about auth implementation",
#     "body": "Should we use email/password or OAuth for the initial release?",
#     "timestamp": "2026-01-27T11:30:00Z"
#   },
#   {
#     "from": "GreenLake",
#     "to": ["All"],
#     "subject": "API changes deployed",
#     "body": "The new rate limiting changes have been deployed to staging.",
#     "timestamp": "2026-01-27T10:45:00Z"
#   }
# ]

# Respond to a message
am_send "BlueOcean" "WhiteHill" "Re: Question about auth implementation" "Let's go with email/password for the initial release to keep it simple. We can add OAuth later as a feature enhancement."

# Check messages from all agents
am_inbox "BlueOcean"
# Output: [] (empty array means no unread messages)
```

**If another agent reserved files you need:**

* Send them a message asking about status

* Work on something else meanwhile

* Don't force-edit reserved files

**Concrete Example:**
```bash
# Try to reserve a file that's already reserved
am_reserve "BlueOcean" "src/api/auth.ts"
# Output: ERROR: FILE_RESERVATION_CONFLICT - File src/api/auth.ts is already reserved by WhiteHill (expires 2026-01-27T12:30:00Z)

# Check who has the reservation
am_agents
# Output:
# Active agents in project rrc:
# - BlueOcean (registered 2026-01-27T10:30:00Z)
# - WhiteHill (registered 2026-01-27T09:15:00Z) - Reserved: src/api/auth.ts (expires 2026-01-27T12:30:00Z)

# Message the agent who has the reservation
am_send "BlueOcean" "WhiteHill" "Need access to auth.ts" "I need to edit src/api/auth.ts to fix the login validation bug. What's your ETA for finishing your work on it?"

# Work on something else while waiting for a response
# ... continue with other tasks ...
```

**Update bead status if you discover new work:**

```bash
bd create "New subtask discovered" --deps discovered-from:$TASK_ID
```

**Concrete Example:**
```bash
# While working on authentication implementation, discover a related task
bd create "Add password reset functionality" --deps discovered-from:bd-15
# Output: Created issue: bd-16

# Update the new task with more details
bd update bd-16 --description "Implement password reset functionality with email verification" --priority 2
# Output: Updated issue: bd-16
```

**Fix any issues UBS reports, then commit:**

```bash
git commit -m "descriptive message"
```

UBS runs automatically via pre-commit hook.

### 6\. Completing Work

```bash
# Release file reservations
am_release "YourAgentName" "src/**,tests/**"

# Close the bead with details
bd close $TASK_ID --reason "Completed: [what you did]"

# Notify other agents
am_send "YourAgentName" "All" "Completed $TASK_ID" "Task complete. Changed files: [list]"

# Commit final state
git add .
git commit -m "Complete: [description]"
```

**Concrete Example:**
```bash
# Release file reservations
am_release "BlueOcean" "src/api/auth.*,src/components/Login.*,tests/auth.*"
# Output: Released reservations for BlueOcean

# Close the bead with details
bd close bd-15 --reason "Completed: Implemented Supabase authentication with login/logout functionality, added unit tests, and updated documentation"
# Output: Closed issue: bd-15

# Notify other agents
am_send "BlueOcean" "All" "Completed bd-15" "Authentication implementation complete. Changed files: src/api/auth.ts, src/components/Login.tsx, tests/auth.test.ts"
# Output: Message sent successfully

# Commit final state
git add .
git commit -m "Complete: Implement user authentication with Supabase"
# Output: [main abc1234] Complete: Implement user authentication with Supabase
#  3 files changed, 127 insertions(+), 5 deletions(-)
```

**Alternative Method (Direct API Call):**
```bash
# Release file reservations using direct curl command
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "release_file_reservations", "arguments": {"project_key": "/home/ubuntu/Developer/rrc", "agent_name": "BlueOcean", "paths": ["src/api/auth.ts"]}}}' \
  http://127.0.0.1:8765/mcp/
# Output: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"Released reservations for BlueOcean"}]}}
```

---

## Code Quality Standards

### Before ANY Commit

1. **Run UBS** on changed files

2. **Fix all UBS issues** (don't skip unless false positive)

3. **Review the diff**: `git diff --cached`

4. **Write descriptive commit message**

### TypeScript/JavaScript

* Use TypeScript strict mode

* No `any` types without justification

* Prefer functional patterns over classes

* Use async/await over raw Promises

* Export types for public APIs

### Python

* Use type hints (PEP 484)

* Follow PEP 8 style

* Use `uv` for dependency management

* No bare `except:` clauses

### Testing

* Write tests for new features

* Run existing tests before committing

* Don't break existing tests

* Use meaningful test names

---

## Communication Patterns

### When to Send Messages

**ALWAYS send when:**

* Starting work on a task

* Completing a task

* Discovering a blocker

* Finding a bug that affects others

* Changing shared interfaces/APIs

**Optional but helpful:**

* Found a useful pattern others should know

* Need input on architecture decisions

* Finished a complex refactor

### Message Format

```bash
am_send "YourName" "OtherAgent,ThirdAgent" \
  "Subject: Clear summary" \
  "Body with details:
  - What: ...
  - Why: ...
  - Impact: ...
  - Next steps: ..."
```

**Concrete Example:**
```bash
## File Reservation Rules

### When to Reserve

**REQUIRED:**

* Editing any file another agent might touch

* Refactoring shared modules

* Changing interfaces/types

**NOT REQUIRED:**

* Creating new files in your own feature branch

* Editing documentation

* Read-only operations

### Reservation Patterns

```bash
# Specific files
am_reserve "Name" "src/api/auth.ts,src/types/user.ts" 3600 true

# Directory patterns
am_reserve "Name" "src/components/**" 3600 true

# Multiple areas
am_reserve "Name" "src/api/**,tests/api/**" 3600 true

# Shorter duration for quick edits
am_reserve "Name" "src/utils/helpers.ts" 600 true
```

**Concrete Example:**
```bash
# Reserve specific files for editing
am_reserve "BlueOcean" "src/api/auth.ts,src/types/user.ts" 3600 true
# Output: Reserved paths for BlueOcean: src/api/auth.ts, src/types/user.ts

# Reserve directory patterns
am_reserve "BlueOcean" "src/components/auth/**" 7200 true
# Output: Reserved paths for BlueOcean: src/components/auth/**

# Reserve multiple areas with different durations
am_reserve "BlueOcean" "src/api/**,tests/api/**" 3600 true
# Output: Reserved paths for BlueOcean: src/api/**, tests/api/**

# Use shorter duration for quick edits
am_reserve "BlueOcean" "README.md" 300 true
# Output: Reserved paths for BlueOcean: README.md
```

**Alternative Method (Direct API Call):**
```bash
# Reserve files using direct curl command
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "file_reservation_paths", "arguments": {"project_key": "/home/ubuntu/Developer/rrc", "agent_name": "BlueOcean", "paths": ["src/api/auth.ts"]}}}' \
  http://127.0.0.1:8765/mcp/
# Output: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"{\"granted\":[{\"id\":1,\"path_pattern\":\"src/api/auth.ts\",\"exclusive\":true,\"reason\":\"\",\"expires_ts\":\"2026-01-31T13:30:00.000Z\"}],\"conflicts\":[]}"}]}}
```

### Handling Conflicts

If you get `FILE_RESERVATION_CONFLICT`:

1. Check who has the reservation: `am_agents`

2. Message them: `am_send "You" "Them" "Need access" "I need to edit X for Y"`

3. Wait for their response or lease expiry

4. Use non-exclusive reservation if just reading: `am_reserve "You" "path" 3600 false`

**Concrete Example:**
```bash
# Handle file reservation conflict
# First, check who has the reservation
am_agents
# Output: 
# Active agents in project rrc:
# - BlueOcean (registered 2026-01-27T10:30:00Z) - Reserved: src/api/auth.ts (expires 2026-01-27T11:30:00Z)
# - WhiteHill (registered 2026-01-27T09:15:00Z)

# Message the agent who has the reservation
am_send "GreenLake" "BlueOcean" "Need access to auth.ts" "I need to edit src/api/auth.ts to fix the login bug. Can you release the reservation or let me know when you'll be done?"

# Use non-exclusive reservation for read-only access
am_reserve "GreenLake" "src/api/auth.ts" 3600 false
# Output: Reserved paths for GreenLake: src/api/auth.ts (non-exclusive)
```

# Shorter duration for quick edits
am_reserve "Name" "src/utils/helpers.ts" 600 true
```

### Handling Conflicts

If you get `FILE_RESERVATION_CONFLICT`:

1. Check who has the reservation: `am_agents`

2. Message them: `am_send "You" "Them" "Need access" "I need to edit X for Y"`

3. Wait for their response or lease expiry

4. Use non-exclusive reservation if just reading: `am_reserve "You" "path" 3600 false`

---

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

**Concrete Example:**
```bash
# Find available work
bd ready
# Output:
# Available tasks:
# - bd-15: Implement user authentication (P1)
# - bd-18: Add error handling to API routes (P2)
# - bd-22: Update documentation (P3)

# View issue details
bd show bd-15
# Output:
# ● bd-15 · Implement user authentication   [● P1 · OPEN]
# Owner: None · Assignee: None · Type: feature
# Created: 2026-01-27 · Updated: 2026-01-27
# 
# DESCRIPTION
# Implement user authentication using Supabase for secure login/logout functionality.
# 
# DEPENDENCIES
# - Blocks: bd-16, bd-17
# - Blocked by: None

# Claim work
bd update bd-15 --status in_progress
# Output: Updated issue: bd-15

# Complete work
bd close bd-15 --reason "Implemented Supabase authentication with login/logout functionality"
# Output: Closed issue: bd-15

# Sync with git
bd sync
# Output: Committed changes to beads database
```
# Output:
# Available tasks:
# - bd-15: Implement user authentication (P1)
# - bd-18: Add error handling to API routes (P2)
# - bd-22: Update documentation (P3)

# View issue details
bd show bd-15
# Output:
# ● bd-15 · Implement user authentication   [● P1 · OPEN]
# Owner: None · Assignee: None · Type: feature
# Created: 2026-01-27 · Updated: 2026-01-27
# 
# DESCRIPTION
# Implement user authentication using Supabase for secure login/logout functionality.
# 
# DEPENDENCIES
# - Blocks: bd-16, bd-17
# - Blocked by: None

# Claim work
bd update bd-15 --status in_progress
# Output: Updated issue: bd-15

# Complete work
bd close bd-15 --reason "Implemented Supabase authentication with login/logout functionality"
# Output: Closed issue: bd-15

# Sync with git
bd sync
# Output: Committed changes to beads database
```

### Task Types

* `bug` - Something broken (priority 0-1)

* `feature` - New functionality (priority 1-2)

* `task` - General work item (priority 2-3)

* `chore` - Maintenance (priority 3-4)

### Dependency Structure

```bash
# Create parent task
bd create "Implement authentication" -p 1 -t feature

# Create dependent subtasks
bd create "Set up Supabase client" -t task --deps discovered-from:bd-1
bd create "Create auth context" -t task --deps discovered-from:bd-1
bd create "Add login UI" -t feature --deps discovered-from:bd-2,bd-3
```

**Concrete Example:**
```bash
# Create parent task
bd create "Implement authentication" -p 1 -t feature
# Output: Created issue: bd-25

# Create dependent subtasks
bd create "Set up Supabase client" -t task --deps discovered-from:bd-25
# Output: Created issue: bd-26

bd create "Create auth context" -t task --deps discovered-from:bd-25
# Output: Created issue: bd-27

bd create "Add login UI" -t feature --deps discovered-from:bd-26,bd-27
# Output: Created issue: bd-28

# Check dependencies
bd show bd-25
# Output will show the created dependencies
```
# Get recommendations
bv --robot-triage

# Check dependency graph
bv --robot-insights

# See parallel work tracks
bv --robot-plan

# Visual TUI
bv
```

---

## CASS Memory System (Session Retention)

**CASS** (Coding Agent Session Search) provides persistent memory across agent sessions.

### Current Status

* **CASS Tool**: Installed and functional (v0.1.36)

* **Database**: `/home/ubuntu/.local/share/coding-agent-search/agent_search.db`

* **Abacus AI Support**: Not natively supported - requires manual export

### Retaining Abacus AI Sessions

Since CASS doesn't have a native Abacus AI connector, sessions must be manually exported to codex format.

#### 1\. Create Session File

Create a JSONL file in codex format at:

```
~/.codex/sessions/YYYY/MM/DD/rollout-<session-name>.jsonl
```

#### 2\. Session Format

Each line is a JSON envelope:

```json
{"timestamp":"2026-01-27T05:00:00.000Z","type":"session_meta","payload":{"id":"session-id","cwd":"/path/to/project","cli_version":"abacus-ai-desktop"}}
{"timestamp":"2026-01-27T05:01:00.000Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"user message here"}]}}
{"timestamp":"2026-01-27T05:02:00.000Z","type":"response_item","payload":{"type":"message","role":"assistant","content":[{"type":"text","text":"assistant response here"}]}}
```

**Required fields:**

* `timestamp`: ISO 8601 format

* `type`: `session_meta` (first line) or `response_item` (messages)

* `payload.role`: `user` or `assistant`

* `payload.content`: Array with text content

#### 3\. Index the Session

```bash
cass index
```

#### 4\. Verify Indexing

```bash
cass status          # Check conversation count
cass search "query"  # Test search functionality
```

### Best Practices

1. **Export at session end** - Create the JSONL file before ending the session

2. **Use descriptive names** - `rollout-<project>-<feature>.jsonl`

3. **Include key context** - Major decisions, solutions, blockers

4. **Summarize work done** - List completed tasks and outcomes

5. **Run index immediately** - Don't forget `cass index` after creating the file

### Searching Past Sessions

```bash
# Search for specific topics
cass search "stripe billing"
cass search "agent mail MCP"

# View full session
cass view <path> <line>

# Check what's indexed
cass stats
```

**Concrete Example:**
```bash
# Search for specific topics
cass search "authentication implementation"
# Output:
# Found 3 relevant sessions:
# 1. ~/.codex/sessions/2026/01/25/rollout-auth-feature.jsonl:15 - "Implemented Supabase authentication with JWT tokens"
# 2. ~/.codex/sessions/2026/01/20/rollout-user-model.jsonl:22 - "Discussed authentication strategy for user model"
# 3. ~/.codex/sessions/2026/01/15/rollout-security-review.jsonl:8 - "Security review of authentication implementation"

# View full session
cass view "~/.codex/sessions/2026/01/25/rollout-auth-feature.jsonl" 15
# Output:
# Session: rollout-auth-feature
# Timestamp: 2026-01-25T14:30:00.000Z
# Path: ~/.codex/sessions/2026/01/25/rollout-auth-feature.jsonl
#
# Relevant excerpt:
# User: "How should we implement authentication?"
# Assistant: "I recommend using Supabase with JWT tokens for stateless authentication. This approach scales well and integrates nicely with our existing stack."

# Check what's indexed
cass stats
# Output:
# CASS Index Statistics:
# Total sessions: 24
# Total messages: 1,247
# Last indexed: 2026-01-30T15:45:00Z
# Storage size: 2.4 MB

### Using CASS Memory

```bash
# Get relevant context before starting complex work
~/cm-context-prompt.sh "implement OAuth flow"

# Add learnings
cm playbook add "Always validate OAuth state parameter to prevent CSRF" \
  --category "security" --tags "oauth,authentication"
```
## Common Patterns

### Starting a New Feature

```
1. ~/cm-context-prompt.sh "feature description"
2. bv --robot-triage | jq '.recommendations[0]'
3. bd update bd-X --status in_progress
4. am_reserve "Name" "relevant/paths/**"
5. Create feature branch: git checkout -b feature/name
6. Implement with tests
7. ubs . before each commit
8. bd close bd-X
9. am_release "Name" "relevant/paths/**"
```

**Concrete Example:**
```
1. ~/cm-context-prompt.sh "implement user profile page"
# Output: Based on previous work, user profiles should include avatar, bio, and account settings

2. bv --robot-triage | jq '.recommendations[0]'
# Output: {"id": "bd-30", "title": "Implement user profile page", "priority": 2, "confidence": 0.92}

3. bd update bd-30 --status in_progress
# Output: Updated issue: bd-30

4. am_reserve "BlueOcean" "src/components/Profile.*,src/api/user.*,tests/components/Profile.*"
# Output: Reserved paths for BlueOcean: src/components/Profile.*, src/api/user.*, tests/components/Profile.*

5. Create feature branch: git checkout -b feature/user-profile

6. Implement with tests
# ... code implementation ...

7. ubs . before each commit
# ... fix any issues reported by UBS ...

8. bd close bd-30 --reason "Implemented user profile page with avatar upload and account settings"
# Output: Closed issue: bd-30

9. am_release "BlueOcean" "src/components/Profile.*,src/api/user.*,tests/components/Profile.*"
# Output: Released reservations for BlueOcean
```

**Concrete Example:**
```
1. ~/cm-context-prompt.sh "implement user profile page"
# Output: Based on previous work, user profiles should include avatar, bio, and account settings

2. bv --robot-triage | jq '.recommendations[0]'
# Output: {"id": "bd-30", "title": "Implement user profile page", "priority": 2, "confidence": 0.92}

3. bd update bd-30 --status in_progress
# Output: Updated issue: bd-30

4. am_reserve "BlueOcean" "src/components/Profile.*,src/api/user.*,tests/components/Profile.*"
# Output: Reserved paths for BlueOcean: src/components/Profile.*, src/api/user.*, tests/components/Profile.*

5. Create feature branch: git checkout -b feature/user-profile

6. Implement with tests
# ... code implementation ...

7. ubs . before each commit
# ... fix any issues reported by UBS ...

8. bd close bd-30 --reason "Implemented user profile page with avatar upload and account settings"
# Output: Closed issue: bd-30

9. am_release "BlueOcean" "src/components/Profile.*,src/api/user.*,tests/components/Profile.*"
# Output: Released reservations for BlueOcean
```

### Fixing a Bug

```
1. Create bug bead: bd create "Bug: description" -p 0 -t bug
2. Claim it: bd update bd-X --status in_progress
3. Reserve affected files
4. Write failing test first
5. Fix bug
6. Verify test passes
7. ubs . before commit
8. Close bead with fix description
```

**Concrete Example:**
```
1. Create bug bead: bd create "Bug: Login fails with special characters in username" -p 0 -t bug
# Output: Created issue: bd-31

2. Claim it: bd update bd-31 --status in_progress
# Output: Updated issue: bd-31

3. Reserve affected files: am_reserve "BlueOcean" "src/api/auth.ts,tests/api/auth.test.ts"
# Output: Reserved paths for BlueOcean: src/api/auth.ts, tests/api/auth.test.ts

4. Write failing test first
# ... add test that reproduces the bug ...

5. Fix bug
# ... implement fix for special character handling ...

6. Verify test passes
# ... run tests to confirm fix ...

7. ubs . before commit
# ... fix any issues reported by UBS ...

8. Close bead with fix description: bd close bd-31 --reason "Fixed authentication validation to properly handle special characters in usernames"
# Output: Closed issue: bd-31
```

### Refactoring

```
1. Announce to team: am_send "Name" "All" "Refactoring X" "..."
2. Reserve broadly: am_reserve "Name" "src/**,tests/**" 7200 true
3. Create refactor task in beads
4. Ensure all tests pass BEFORE refactoring
5. Make changes incrementally
6. Run tests after each step
7. ubs . frequently
8. Close bead, release reservations
```

**Concrete Example:**
```
1. Announce to team: am_send "BlueOcean" "All" "Refactoring authentication module" "I'm refactoring the authentication module to improve code organization and testability. This may take several hours."
# Output: Message sent successfully

2. Reserve broadly: am_reserve "BlueOcean" "src/api/auth/**,tests/api/auth/**" 7200 true
# Output: Reserved paths for BlueOcean: src/api/auth/**, tests/api/auth/**

3. Create refactor task in beads: bd create "Refactor authentication module for better testability" -p 2 -t task
# Output: Created issue: bd-32

4. Ensure all tests pass BEFORE refactoring: npm test
# ... verify all tests pass ...

5. Make changes incrementally
# ... make small, focused changes ...

6. Run tests after each step: npm test
# ... verify tests still pass after each change ...

7. ubs . frequently
# ... fix any issues reported by UBS ...

8. Close bead, release reservations: bd close bd-32 --reason "Refactored authentication module into smaller, more testable functions"
# Output: Closed issue: bd-32

9. Release reservations: am_release "BlueOcean" "src/api/auth/**,tests/api/auth/**"
# Output: Released reservations for BlueOcean
```
PROJECT_PATH="$2"
DATE=$(date +%Y/%m/%d)
SESSION_DIR="$HOME/.codex/sessions/$DATE"
SESSION_FILE="$SESSION_DIR/rollout-$SESSION_NAME.jsonl"

mkdir -p "$SESSION_DIR"

# Create session metadata
echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"type\":\"session_meta\",\"payload\":{\"id\":\"$SESSION_NAME\",\"cwd\":\"$PROJECT_PATH\",\"cli_version\":\"abacus-ai-desktop\"}}" > "$SESSION_FILE"

echo "Session file created: $SESSION_FILE"
echo "Add messages, then run: cass index"
```

Usage:

```bash
./export_session.sh "myproject-work" "/home/ubuntu/Developer/myproject"
```

### Using CASS Memory

```bash
# Get relevant context before starting complex work
~/cm-context-prompt.sh "implement OAuth flow"

# Add learnings
cm playbook add "Always validate OAuth state parameter to prevent CSRF" \
  --category "security" --tags "oauth,authentication"
```

---

## Common Patterns

### Starting a New Feature

```
1. ~/cm-context-prompt.sh "feature description"
2. bv --robot-triage | jq '.recommendations[0]'
3. bd update bd-X --status in_progress
4. am_reserve "Name" "relevant/paths/**"
5. Create feature branch: git checkout -b feature/name
6. Implement with tests
7. ubs . before each commit
8. bd close bd-X
9. am_release "Name" "relevant/paths/**"
```

### Fixing a Bug

```
1. Create bug bead: bd create "Bug: description" -p 0 -t bug
2. Claim it: bd update bd-X --status in_progress
3. Reserve affected files
4. Write failing test first
5. Fix bug
6. Verify test passes
7. ubs . before commit
8. Close bead with fix description
```

### Refactoring

```
1. Announce to team: am_send "Name" "All" "Refactoring X" "..."
2. Reserve broadly: am_reserve "Name" "src/**,tests/**" 7200 true
3. Create refactor task in beads
4. Ensure all tests pass BEFORE refactoring
5. Make changes incrementally
6. Run tests after each step
7. ubs . frequently
8. Close bead, release reservations
```

### Multi-Agent Coordination

**Spatial Separation:**

* Agent A: Backend (src/api/\*\*)

* Agent B: Frontend (src/components/\*\*)

* Agent C: Tests (tests/\*\*)

**Temporal Coordination:**

* Use reservations to serialize work on shared files

* Check messages frequently

* Announce blocks immediately

**Handoff Protocol:**

```bash
# Agent A finishes API
am_send "AgentA" "AgentB" "API ready" "Auth endpoints done at /api/auth/*"

# Agent B can now start
am_reserve "AgentB" "src/components/auth/**"
```

---

## Emergency Procedures

### If You Made a Mistake

**Don't panic. Don't use `git reset --hard`.**

```bash
# 1. Stop and assess
git status

# 2. If uncommitted, stash
git stash

# 3. If committed, revert
git revert HEAD

# 4. Ask for help
am_send "You" "All" "Need help" "I made mistake: [what happened]"
```

**Concrete Example:**
```bash
# 1. Stop and assess
git status
# Output:
# On branch feature/auth
# Your branch is ahead of 'origin/feature/auth' by 1 commit.
#   (use "git push" to publish your local commits)
#
# Changes not staged for commit:
#   (use "git add <file>..." to update what will be committed)
#   (use "git restore <file>..." to discard changes in working directory)
#         modified:   src/api/auth.ts
#         modified:   src/components/Login.tsx
#
# Untracked files:
#   (use "git add <file>..." to include in what will be committed)
#         temp-debug.log

# 2. If uncommitted, stash
git stash
# Output: Saved working directory and index state WIP on feature/auth: abc1234 Implement login functionality

# 3. If committed, revert
git revert HEAD
# Output: [feature/auth def5678] Revert "Break authentication implementation"
#  2 files changed, 15 insertions(+), 25 deletions(-)

# 4. Ask for help
am_send "BlueOcean" "All" "Need help" "I accidentally broke the authentication implementation while trying to optimize the login flow. I've stashed my changes and reverted the commit. Can someone help me figure out the right approach?"
# Output: Message sent successfully
```

### If Agent Mail is Down

```bash
# Check status
am_status

# Restart if needed
tmux send-keys -t acfs-services C-c
tmux send-keys -t acfs-services "am" Enter

# If really broken, work solo mode (skip am_* commands, coordinate via commits)
```

**Concrete Example:**
```bash
# Check status
am_status
# Output: ERROR: Could not connect to Agent Mail service at http://127.0.0.1:8765/mcp/

# Restart if needed
tmux send-keys -t acfs-services C-c
# Output: (terminated)
tmux send-keys -t acfs-services "am" Enter
# Output: Starting Agent Mail service...

# If really broken, work solo mode (skip am_* commands, coordinate via commits)
# Continue working but document everything thoroughly in commit messages
git commit -m "Implement user registration - NOTE: Agent Mail is down, no coordination with other agents possible"
```

### If UBS Blocks Commit (False Positive)

```bash
# Review the UBS output carefully
ubs <file>

# If genuinely false positive:
SKIP_UBS=1 git commit -m "message (UBS false positive: reason)"

# But document WHY in commit message
```

**Concrete Example:**
```bash
# Review the UBS output carefully
ubs src/api/auth.ts
# Output:
# src/api/auth.ts:45:5: error: Expected 2 arguments, but got 1.
#       validateToken(token);
#       ~~~~~~~~~~~~~~~~~~~~
#
# UBS detected potential issue with validateToken function call.

# After reviewing, determine it's a false positive because the function has a default parameter
# If genuinely false positive:
SKIP_UBS=1 git commit -m "Implement token validation (UBS false positive: validateToken has default parameter for second argument)"
# Output: [feature/auth abc1234] Implement token validation (UBS false positive: validateToken has default parameter for second argument)
```

---

## Anti-Patterns (DON'T DO THESE)

❌ **Don't:**

* Delete files without explicit permission

* Force push (`git push -f`)

* Commit without running UBS

* Edit reserved files

* Ignore messages from other agents

* Work on tasks without claiming them in beads

* Skip testing

* Use `-dangerously-skip-permissions` flags in production

* Commit directly to main (use feature branches)

✅ **Do:**

* Ask before destructive operations

* Reserve files before editing

* Check messages regularly

* Update beads as you work

* Run UBS before every commit

* Write tests for new code

* Use feature branches

* Communicate early and often

* Before finishing a task, run git add ., git commit -m 'your message', and then run git sync to ensure the remote is updated.
---

## Quick Reference

```bash
# Agent Mail
am_register "Name" "abacusai" "model"
am_agents
am_inbox "Name"
am_send "Name" "To" "Subject" "Body"
am_reserve "Name" "paths/**" 3600 true
am_release "Name" "paths/**"

# Beads
bd ready
bd create "title" -p 1 -t task
bd update bd-X --status in_progress
bd close bd-X --reason "done"
bv --robot-triage

# CASS Memory
~/cm-context-prompt.sh "task"
cm playbook add "rule" --category "cat"
cass search "query"
cass index

# UBS
ubs .
ubs $(git diff --cached --name-only)

# Git
git status
git diff --cached
git add <files>
git commit -m "message"
```

**Concrete Example:**
```bash
# Agent Mail
am_register "BlueOcean" "abacusai" "sonnet"
# Output: Registered agent BlueOcean with project /home/ubuntu/Developer/rrc

am_agents
# Output: Active agents in project rrc: BlueOcean

am_inbox "BlueOcean"
# Output: []

am_send "BlueOcean" "All" "Starting work" "I'm starting work on implementing user authentication"
# Output: Message sent successfully

am_reserve "BlueOcean" "src/api/auth.ts" 3600 true
# Output: Reserved paths for BlueOcean: src/api/auth.ts

am_release "BlueOcean" "src/api/auth.ts"
# Output: Released reservations for BlueOcean

# Beads
bd ready
# Output: Available tasks: bd-15: Implement user authentication (P1)

bd create "Add password reset functionality" -p 2 -t feature
# Output: Created issue: bd-16

bd update bd-15 --status in_progress
# Output: Updated issue: bd-15

bd close bd-15 --reason "Implemented Supabase authentication"
# Output: Closed issue: bd-15

bv --robot-triage
# Output: Shows recommended tasks based on priority and dependencies

# CASS Memory
~/cm-context-prompt.sh "implement OAuth flow"
# Output: Based on previous sessions, here are recommendations for implementing OAuth...

cm playbook add "Always validate OAuth state parameter to prevent CSRF" --category "security" --tags "oauth,authentication"
# Output: Added rule to playbook: Always validate OAuth state parameter to prevent CSRF

cass search "authentication implementation"
# Output: Found relevant sessions about authentication implementation

cass index
# Output: Indexed 1 new session

# UBS
ubs .
# Output: Runs UBS on all changed files

ubs $(git diff --cached --name-only)
# Output: Runs UBS on staged files only

# Git
git status
# Output: Shows current git status

git diff --cached
# Output: Shows staged changes

git add src/api/auth.ts
# Output: Stages the file for commit

git commit -m "Implement user authentication with Supabase"
# Output: Creates a new commit with the specified message
```

---

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

### MANDATORY WORKFLOW

1. **File issues for remaining work** - Create issues for anything that needs follow-up

2. **Run quality gates** (if code changed) - Tests, linters, builds

3. **Update issue status** - Close finished work, update in-progress items

4. **PUSH TO REMOTE** - This is MANDATORY:

```bash
git pull --rebase
bd sync
git push
git status  # MUST show "up to date with origin"
```

**Concrete Example:**
```bash
# 1. File issues for remaining work
bd create "Add unit tests for profile page avatar upload" --type=task --priority=2
# Output: Created issue: bd-32

bd create "Implement accessibility features for profile page" --type=feature --priority=3
# Output: Created issue: bd-33

# 2. Run quality gates (if code changed)
npm test
# Output: Tests pass

npm run lint
# Output: Linting passes

npm run build
# Output: Build succeeds

# 3. Update issue status
bd close bd-25 --reason="Implemented user profile page with avatar upload and account settings"
# Output: Closed issue: bd-25

bd update bd-32 --status=in_progress
# Output: Updated issue: bd-32

# 4. PUSH TO REMOTE
git pull --rebase
# Output: Already up to date

bd sync
# Output: Committed changes to beads database

git push
# Output: To github.com:user/repo.git
#    def5678..abc1234 feature/user-profile -> feature/user-profile

git status
# Output: On branch feature/user-profile
# Your branch is up to date with 'origin/feature/user-profile'.
# nothing to commit, working tree clean
```

1. **Clean up** - Clear stashes, prune remote branches

2. **Verify** - All changes committed AND pushed

3. **Hand off** - Provide context for next session

### CRITICAL RULES

* Work is NOT complete until `git push` succeeds

* NEVER stop before pushing - that leaves work stranded locally

* NEVER say "ready to push when you are" - YOU must push

* If push fails, resolve and retry until it succeeds

<!-- bv-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View issues (launches TUI - avoid in automated sessions)
bv

# CLI commands for agents (use these instead)
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # All open issues
bd show <id>          # Full issue details with dependencies
bd create --title="..." --type=task --priority=2
bd update <id> --status=in_progress
bd close <id> --reason="Completed"
bd close <id1> <id2>  # Close multiple issues at once
bd sync               # Commit and push changes
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

**Concrete Example:**
```
1. **Start**: Run `bd ready` to find actionable work
   bd ready
   # Output: Shows available tasks that are not blocked by dependencies

2. **Claim**: Use `bd update <id> --status=in_progress`
### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

**Concrete Example:**
```bash
# Before ending any session, run this checklist:

# Check what changed
git status
# Output:
# On branch feature/user-profile
# Your branch is up to date with 'origin/feature/user-profile'.
# 
# Changes to be committed:
#   (use "git reset HEAD <file>..." to unstage)
#         new file:   src/components/Profile.tsx
#         modified:   src/api/user.ts
# 
# Changes not staged for commit:
#   (use "git add <file>..." to update what will be committed)
#   (use "git restore <file>..." to discard changes in working directory)
#         modified:   tests/components/Profile.test.ts

# Stage code changes
git add src/components/Profile.tsx src/api/user.ts tests/components/Profile.test.ts
# Output: (no output indicates success)

# Commit beads changes
bd sync
# Output: Committed changes to beads database

# Commit code
git commit -m "Implement user profile page with avatar upload functionality"
# Output: [feature/user-profile abc1234] Implement user profile page with avatar upload functionality
#  3 files changed, 127 insertions(+), 5 deletions(-)
#  create mode 100644 src/components/Profile.tsx

# Commit any new beads changes
bd sync
# Output: No changes to commit

# Push to remote
git push
# Output: To github.com:user/repo.git
#    def5678..abc1234 feature/user-profile -> feature/user-profile
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

**Concrete Example:**
```
# Check `bd ready` at session start to find available work
bd ready
# Output: Shows available tasks that are not blocked by dependencies

# Update status as you work (in_progress → closed)
bd update bd-25 --status=in_progress
# ... work on the task ...
bd close bd-25 --reason="Implemented user profile page with avatar upload and account settings"

# Create new issues with `bd create` when you discover tasks
bd create "Add dark mode toggle to profile page" --type=feature --priority=3
# Output: Created issue: bd-31

# Use descriptive titles and set appropriate priority/type
bd update bd-31 --title="Add dark mode toggle to profile page with localStorage persistence" --priority=2 --type=feature
# Output: Updated issue: bd-31

# Always `bd sync` before ending session
bd sync
# Output: Committed changes to beads database and pushed to remote repository
```

# Types: task, bug, feature, epic, question, docs
bd update bd-16 --type=feature
# Output: Updates the type of issue bd-16 to feature

# Blocking: `bd dep add <issue> <depends-on>` to add dependencies
bd dep add bd-17 bd-16
# Output: Adds a dependency where bd-17 depends on bd-16
```
bd list --status=open
# Output:
# Open issues:
# - bd-15: Implement user authentication (P1) [IN_PROGRESS] - Assigned to BlueOcean
# - bd-18: Add error handling to API routes (P2) [OPEN]
# - bd-22: Update documentation (P3) [OPEN]
# - bd-25: Implement user profile page (P2) [OPEN]

# Full issue details with dependencies
bd show bd-15
# Output:
# ● bd-15 · Implement user authentication   [● P1 · IN_PROGRESS]
# Owner: None · Assignee: BlueOcean · Type: feature
# Created: 2026-01-27 · Updated: 2026-01-27
#
# DESCRIPTION
# Implement user authentication using Supabase for secure login/logout functionality.
#
# DEPENDENCIES
# - Blocks: bd-16, bd-17
# - Blocked by: None

# Create a new issue
bd create --title="Add OAuth integration" --type=feature --priority=2
# Output: Created issue: bd-30

# Update issue status
bd update bd-30 --status=in_progress
# Output: Updated issue: bd-30

# Close an issue
bd close bd-30 --reason="Implemented OAuth integration with Google and GitHub providers"
# Output: Closed issue: bd-30

# Close multiple issues at once
bd close bd-18 bd-22 --reason="Completed error handling and documentation updates"
# Output: Closed issues: bd-18, bd-22

# Commit and push changes
bd sync
# Output: Committed changes to beads database and pushed to remote repository
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `bd ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
- **Types**: task, bug, feature, epic, question, docs
- **Blocking**: `bd dep add <issue> <depends-on>` to add dependencies

**Concrete Example:**
```bash
# Dependencies: Issues can block other issues. `bd ready` shows only unblocked work.
bd show bd-16
# Output:
# ● bd-16 · Add password reset functionality   [● P2 · OPEN]
# Owner: None · Assignee: None · Type: feature
# Created: 2026-01-27 · Updated: 2026-01-27
#
# DESCRIPTION
# Implement password reset functionality with email verification
#
# DEPENDENCIES
# - Blocks: None
# - Blocked by: bd-15 (Implement user authentication)

bd ready
# Output: Shows available tasks that are not blocked by dependencies
# Note: bd-16 won't appear in the ready list because it's blocked by bd-15

# Priority: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
bd update bd-16 --priority=1
# Output: Updates the priority of issue bd-16 to P1 (high)

# Types: task, bug, feature, epic, question, docs
bd update bd-16 --type=feature
# Output: Updates the type of issue bd-16 to feature

# Blocking: `bd dep add <issue> <depends-on>` to add dependencies
bd dep add bd-17 bd-16
# Output: Adds a dependency where bd-17 depends on bd-16
```

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

**Concrete Example:**
```
# Check `bd ready` at session start to find available work
bd ready
# Output: Shows available tasks that are not blocked by dependencies
# - bd-18: Add error handling to API routes (P2)
# - bd-22: Update documentation (P3)
# - bd-25: Implement user profile page (P2)

# Update status as you work (in_progress → closed)
bd update bd-25 --status=in_progress
# ... work on the task ...
bd close bd-25 --reason="Implemented user profile page with avatar upload and account settings"

# Create new issues with `bd create` when you discover tasks
bd create "Add dark mode toggle to profile page" --type=feature --priority=3
# Output: Created issue: bd-31

# Use descriptive titles and set appropriate priority/type
bd update bd-31 --title="Add dark mode toggle to profile page with localStorage persistence" --priority=2 --type=feature
# Output: Updated issue: bd-31

# Always `bd sync` before ending session
bd sync
# Output: Committed changes to beads database and pushed to remote repository
```

<!-- end-bv-agent-instructions -->
