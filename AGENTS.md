### Purpose & Scope

This document defines the multi-agent coordination workflow, required safety rules, tool conventions, and practical command snippets for working in this repository. It is written for autonomous coding agents and humans collaborating with them.

### ABSOLUTE RULE: NO DELETIONS WITHOUT EXPLICIT PERMISSION

You may **NOT delete any file or directory** unless I explicitly give the exact command **in this session**.

- This includes files you just created (tests, tmp files, scripts, etc.)
- You do not get to decide that something is "safe" to remove
- If you think something should be removed, **stop and ask**. You must receive clear written approval **before** any deletion command is even proposed

Forbidden without explicit approval:

- `git reset --hard`
- `git clean -fd`
- `rm -rf`
- Any command that can delete or overwrite code/data

If unsure: Ask first. Prefer safe tools: `git status`, `git diff`, `git stash`, copying to backups.

---

### Quick Start (practical — follow this at session start)

### 1) Session Start

```bash
# Register with Agent Mail
source ~/.acfs/scripts/agent-mail-helpers.sh
am_register "YourAgentName" "abacusai" "qwen"

# Check who else is active
am_agents

# Check inbox for messages
am_inbox "YourAgentName"
```

### 2) Get Context & Priorities

```bash
# Get CASS Memory context
~/cm-context-prompt.sh "your task description"

# Check BV triage (top picks)
bv --robot-triage | jq '.recommendations[0:3]'

# Check ready tasks
br ready --json
```

### 3) Claim Work (required for multi-agent)

```bash
# Pick a task (use BV recommendations)
TASK_ID="br-X"

# Claim it
br update $TASK_ID --status in_progress

# Reserve files you'll edit (REQUIRED for multi-agent)
am_reserve "YourAgentName" "src/**,tests/**" 3600 true

# Announce to other agents
am_send "YourAgentName" "All" "Working on $TASK_ID" "I'm starting work on: [description]"
```

### 4) During Work (routine)

- Periodically check messages:

```bash
am_inbox "YourAgentName"
```

- If you discover new work:

```bash
br create "New subtask discovered" --deps discovered-from:$TASK_ID
```

- Fix UBS-reported issues before commits (see UBS section)
- Commit fixes as you go:

```bash
git commit -m "descriptive message"
```

### 5) Completing Work

```bash
# Release file reservations
am_release "YourAgentName" "src/**,tests/**"

# Close the bead with details
br close $TASK_ID --reason "Completed: [what you did]"

# Notify other agents
am_send "YourAgentName" "All" "Completed $TASK_ID" "Task complete. Changed files: [list]"

# Commit final state
git add .
git commit -m "Complete: [description]"
```

---

### High-level Workflow (narrative)

1. Session start → register & check mail.
2. Run BV triage → choose a `br` ready issue.
3. Claim issue in `br` and `am_reserve` files you will edit.
4. Announce to agents in Mail with `thread_id = br-###`.
5. Work: check mail, run UBS on changes, create subtasks if needed.
6. Release reservations, close bead, `br sync --flush-only` and commit `.beads/`.
7. End session with the Landing-the-Plane checklist.

---

### Project Stack & Key Tools (at-a-glance)

### Languages & Runtimes

- Bun (JavaScript/TypeScript)
- Python (via uv)
- Rust (if needed)

### Key Tools

- `br` (Beads) — task tracking
- `bv` — planning & triage engine for Beads
- `ubs` — Ultimate Bug Scanner (run before commits)
- Agent Mail (`am_*`) — multi-agent coordination (reservations, messaging)
- CASS (`cass`) — session search & memory
- `ast-grep`, `rg` (ripgrep) — code search & rewrite
- `mcp__morph-mcp__warp_grep` — exploratory AI-powered code search
- Coding Agents: Abacus CLI with models

---

### Agent Coordination & Conventions

### Shared Identifiers & Naming

- Use Beads issue IDs as the canonical cross-tool identifier: `br-123`
- Mail `thread_id` = `br-###`
- Mail subject prefix = `[br-###] ...`
- File reservation `reason` = `br-###`
- Commit messages should include the `br-###` for traceability

### Reservations & Announcements

- Always `am_reserve` before editing shared files (REQUIRED).
- When done, `am_release` those paths immediately.
- Use `am_send` to create/acknowledge threads; set `ack_required` when handoff is required.

Example reservation flow (pseudo/implementation shown earlier):

```bash
# Reserve
am_reserve "YourAgentName" "src/**,tests/**" 3600 true

# Announce
am_send "YourAgentName" "All" "Working on $TASK_ID" "I'm starting work on: [description]"

# Release when done
am_release "YourAgentName" "src/**,tests/**"
```

---

### Beads (`br`) — Dependency-Aware Issue Tracking

### Purpose

`br` manages issues in `.beads/` and is the single source of truth for task status, dependencies and priorities.

### Important Commands (agent-safe)

```bash
# Find ready work (non-blocked)
br ready --json

# View open issues
br list --status=open

# Show details for an issue
br show <id>

# Create/update/close issues
br create --title="..." --type=task --priority=2
br update <id> --status=in_progress
br close <id> --reason "Completed"
```

Notes:

- `br` is non-invasive — it does NOT execute git commands automatically.
- After `br sync --flush-only`, manually commit `.beads/` changes:

```bash
br sync --flush-only
git add .beads/
git commit -m "[br-123] sync beads"
```

### Conventions

- Use numeric priorities: P0=critical, P1=high, P2=medium, P3=low, P4=backlog.
- Types: `task`, `bug`, `feature`, `epic`, `question`, `docs`.
- Use `br dep add <issue> <depends-on>` to add dependencies.

---

### BV — Graph-aware Triage Engine

### Entry Points

- Start here for what to work on:

```bash
bv --robot-triage        # Full triage
bv --robot-next          # Minimal: single top pick + claim command
```

### Robot flags

- Always use `-robot-*` (JSON/robot mode) for automation.
- Do not use interactive TUI in automated sessions.

### Useful outputs

- `recommendations`, `quick_ref`, `quick_wins`, `blockers_to_clear`, `commands` (copy-pasteable shell commands)
- Use `jq` to extract fields:

```bash
bv --robot-triage | jq '.recommendations[0]'
```

### Scoping & Filtering examples

```bash
bv --robot-plan --label backend
bv --robot-insights --as-of HEAD~30
bv --recipe actionable --robot-plan
```

---

### UBS — Ultimate Bug Scanner (Quality Gate)

- Golden Rule: run `ubs <changed-files>` before every commit. Exit 0 = safe; Exit > 0 = fix & re-run.

Common commands:

```bash
# Specific files
ubs file.rs file2.rs

# Staged files (before commit)
ubs $(git diff --name-only --cached)

# Language filtered scan
ubs --only=rust,toml src/

# CI mode - fail-on-warning
ubs --ci --fail-on-warning .
```

Fix workflow:

1. Read the finding and suggested fix
2. Go to `file:line:col`
3. Fix root cause
4. Re-run `ubs <file>` until exit 0
5. Commit

Severity guidance:

- Critical: fix always (memory-safety, SQL injections, etc.)
- Important: production-impacting (unwrap panics, leaks)
- Contextual: TODOs, debug prints — use judgment

---

### Code Search & Rewrites

- Use `ast-grep` when structure matters and for safe rewrites/refactors.
- Use `ripgrep` (`rg`) for fast textual searches.
- Use Morph Warp Grep (`mcp__morph-mcp__warp_grep`) for exploratory, "how does X work?" queries via an agent.

Examples:

```bash
# ast-grep structural match
ast-grep run -l Rust -p '$EXPR.unwrap()'

# ripgrep quick textual hunt
rg -n 'println!' -t rust

# combine: fast shortlist then AST precision
rg -l -t rust 'unwrap\(' | xargs ast-grep run -l Rust -p '$X.unwrap()' --json
```

Warp_grep usage (pseudo):

```
mcp__morph-mcp__warp_grep(
  repoPath: "/dp/beads_rust",
  query: "How does the JSONL sync engine handle merge conflicts?"
)
```

Anti-patterns:

- Don't use `warp_grep` for exact symbol lookup → use `rg`.
- Don't use `rg` for deep architecture understanding → use `warp_grep`.

---

### Mapping Cheat Sheet (quick reference)

| Concept | Value |
| --- | --- |
| Mail `thread_id` | `br-###` |
| Mail subject | `[br-###] ...` |
| File reservation `reason` | `br-###` |
| Commit messages | Include `br-###` for traceability |

---

### Session Protocol (detailed checklist)

### Start of session

1. `am_register` (if not already)
2. `am_inbox "YourAgentName"`
3. `bv --robot-triage` → pick candidate(s)
4. `br ready --json` → confirm ready item

### While working

- `am_reserve` before editing files.
- `am_send` to announce start in the `br-###` thread.
- Run tests, linters, `ubs` before commits.
- Create `br` subtasks for discovered work.

### Before ending session (MANDATORY checklist)

```bash
git status              # Check what changed
git add <files>         # Stage code changes
br sync --flush-only    # Export beads to JSONL (NO git ops inside br)
git add .beads/         # Stage beads changes
git commit -m "..."     # Commit everything together
git push                # Push to remote
```

Also:

1. File issues for remaining work
2. Run quality gates (tests, linters, builds)
3. Update issue statuses (close finished work)
4. Provide handoff context in mail thread (`[br-###] Completed`)

---

### For Coding Agents — parsing & automation rules

- ALWAYS use `-json` or `-robot` flags when parsing `br` or `bv` output programmatically.

```bash
# CORRECT (stable)
br list --json | jq '.[0]'
br ready --robot

# WRONG (unstable)
br list | head -1
```

Reasons:

- JSON guarantees stable schema, no ANSI escapes, diagnostics on stderr, documented schemas available

Schema discovery:

- `br schema all --format json` — emits JSON Schema documents

---

### bv / br / robot output notes

- Robot JSON includes `data_hash`, `status`, `as_of`, `as_of_commit`
- Two-phase analysis in `bv`: quick graph metrics (instant) then PageRank/etc. (async)
- Use `jq` to extract the fields you need (examples throughout this doc)

---

### Examples & Useful Snippets

### Claim + Reserve + Announce

```bash
TASK_ID="br-123"
br update $TASK_ID --status in_progress
am_reserve "Agent007" "src/**,tests/**" 3600 true
am_send "Agent007" "All" "[br-123] Start: Fix widget" "Starting now. ETA 2h"
```

### Triage to claim (one-liner workflow)

```bash
bv --robot-next | jq -r '.recommendations[0].command' | bash
# (bv may output a shellable claim command)
```

### UBS before commit

```bash
# Stage files, then run UBS on staged files
git add foo.rs bar.rs
ubs $(git diff --name-only --cached) && git commit -m "[br-123] fix: ..."
```

---

### Best Practices & Anti-patterns

- Prefer safe exploratory commands (`rg`, `br ready`) over destructive ones.
- Do not remove files or run destructive git commands without explicit approval.
- Use JSON/robot flags for automation — never parse human TUI output in scripts.
- Reserve files before editing and release promptly on completion.
- Include `br-###` in commit messages and mails for traceability.

---

### Appendix: Tool References (compact)

### br (Beads)

- `br ready`, `br show <id>`, `br update <id> --status=in_progress`, `br close <id>`
- `br sync --flush-only` → must `git add .beads/` + commit manually

### bv

- `bv --robot-triage`
- Use `-robot-plan`, `-robot-insights`, and `-robot-next` for automation
- Always prefer robot output (`-robot-*`)

### UBS

- `ubs <files>` or `ubs $(git diff --name-only --cached)`

### Agent Mail

- `am_register`, `am_agents`, `am_inbox`, `am_reserve`, `am_release`, `am_send`

### Code Search

- `rg` for quick text
- `ast-grep` for AST-based rewrites
- `warp_grep` for exploratory AI searches


````markdown
## UBS Quick Reference for AI Agents

UBS stands for "Ultimate Bug Scanner": **The AI Coding Agent's Secret Weapon: Flagging Likely Bugs for Fixing Early On**

**Install:** `curl -sSL https://raw.githubusercontent.com/Dicklesworthstone/ultimate_bug_scanner/master/install.sh | bash`

**Golden Rule:** `ubs <changed-files>` before every commit. Exit 0 = safe. Exit >0 = fix & re-run.

**Commands:**
```bash
ubs file.ts file2.py                    # Specific files (< 1s) — USE THIS
ubs $(git diff --name-only --cached)    # Staged files — before commit
ubs --only=js,python src/               # Language filter (3-5x faster)
ubs --ci --fail-on-warning .            # CI mode — before PR
ubs --help                              # Full command reference
ubs sessions --entries 1                # Tail the latest install session log
ubs .                                   # Whole project (ignores things like .venv and node_modules automatically)
```

**Output Format:**
```
⚠️  Category (N errors)
    file.ts:42:5 – Issue description
    💡 Suggested fix
Exit code: 1
```
Parse: `file:line:col` → location | 💡 → how to fix | Exit 0/1 → pass/fail

**Fix Workflow:**
1. Read finding → category + fix suggestion
2. Navigate `file:line:col` → view context
3. Verify real issue (not false positive)
4. Fix root cause (not symptom)
5. Re-run `ubs <file>` → exit 0
6. Commit

**Speed Critical:** Scope to changed files. `ubs src/file.ts` (< 1s) vs `ubs .` (30s). Never full scan for small edits.

**Bug Severity:**
- **Critical** (always fix): Null safety, XSS/injection, async/await, memory leaks
- **Important** (production): Type narrowing, division-by-zero, resource leaks
- **Contextual** (judgment): TODO/FIXME, console logs

**Anti-Patterns:**
- ❌ Ignore findings → ✅ Investigate each
- ❌ Full scan per edit → ✅ Scope to file
- ❌ Fix symptom (`if (x) { x.y }`) → ✅ Root cause (`x?.y`)
````
