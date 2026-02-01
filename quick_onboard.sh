#!/bin/bash
# quick_onboard.sh
# Process a single session quickly with your agent

set -e

OUTPUT_DIR="$HOME/.cass-memory/onboarding-quick"
mkdir -p "$OUTPUT_DIR"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Session Onboarding${NC}"
echo ""

# Get the next priority session
echo -e "${YELLOW}Finding next session to process...${NC}"
SESSION=$(cm onboard sample --fill-gaps --limit 1 --json 2>/dev/null | jq -r '.sessions[0].path' 2>/dev/null)

if [ -z "$SESSION" ] || [ "$SESSION" = "null" ]; then
    echo -e "${GREEN}✅ No sessions to process!${NC}"
    echo ""
    echo "Your playbook is well-populated. Check status:"
    echo "  cm onboard status"
    exit 0
fi

echo -e "${GREEN}Selected: $SESSION${NC}"
echo ""

# Get context
CONTEXT_FILE="$OUTPUT_DIR/context.json"
PROMPT_FILE="$OUTPUT_DIR/prompt.txt"
RULES_FILE="$OUTPUT_DIR/rules.json"

echo -e "${YELLOW}📥 Fetching session context...${NC}"
cm onboard read "$SESSION" --template --json > "$CONTEXT_FILE"

# Show metadata
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}SESSION INFO:${NC}"
jq -r '.metadata | "Workspace: \(.workspace // "N/A")\nMessages: \(.messageCount)\nTopics: \(.topicHints | join(", "))"' "$CONTEXT_FILE" 2>/dev/null

echo ""
echo -e "${YELLOW}FOCUS AREAS:${NC}"
jq -r '.context.suggestedFocus // "General analysis"' "$CONTEXT_FILE" 2>/dev/null

echo ""
echo -e "${YELLOW}GAPS TO FILL:${NC}"
jq -r '.context.playbookGaps | "Critical: \(.critical | join(", "))\nLow coverage: \(.underrepresented | join(", "))"' "$CONTEXT_FILE" 2>/dev/null
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create agent prompt
cat > "$PROMPT_FILE" << 'EOF'
Analyze this coding session and extract 2-5 reusable rules.

RULES FORMAT:
{
  "rules": [
    {
      "content": "Imperative statement (e.g., 'Always validate input before processing')",
      "category": "one of: debugging, testing, architecture, workflow, documentation, integration, collaboration, git, security, performance",
      "reasoning": "Why this rule is valuable (1-2 sentences)"
    }
  ],
  "session_summary": "Brief summary of what happened (1-2 sentences)"
}

GUIDELINES:
- Make rules actionable and specific
- Focus on patterns that generalize beyond this session
- Prefer "Always X" or "When Y, do Z" format
- Use "AVOID: X" for anti-patterns
- Choose the most specific category that fits

SESSION CONTEXT:
EOF

cat "$CONTEXT_FILE" >> "$PROMPT_FILE"

echo -e "${GREEN}✓ Agent prompt ready${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 NEXT STEPS:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Copy the prompt (pre-populated with session context):"
echo ""
echo -e "   ${YELLOW}cat $PROMPT_FILE | pbcopy${NC}  # macOS"
echo -e "   ${YELLOW}cat $PROMPT_FILE | xclip -selection clipboard${NC}  # Linux"
echo -e "   ${YELLOW}cat $PROMPT_FILE${NC}  # View and copy manually"
echo ""
echo "2. Paste into your Abacus AI CLI agent"
echo ""
echo "3. Copy agent's JSON response and save to:"
echo -e "   ${YELLOW}$RULES_FILE${NC}"
echo ""
echo "4. Re-run this script to add the rules:"
echo -e "   ${YELLOW}bash $0${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if rules already exist (re-run scenario)
if [ -f "$RULES_FILE" ]; then
    echo -e "${GREEN}Found rules file!${NC}"
    echo ""
    
    # Validate JSON
    if ! jq empty "$RULES_FILE" 2>/dev/null; then
        echo -e "${YELLOW}⚠ Invalid JSON detected. Please fix:${NC}"
        echo "  $RULES_FILE"
        echo ""
        echo "Common issues:"
        echo "  - Missing quotes around strings"
        echo "  - Trailing commas"
        echo "  - Unclosed brackets"
        exit 1
    fi
    
    # Show preview
    echo -e "${YELLOW}Rules to add:${NC}"
    echo ""
    jq -r '.rules[] | "  [\(.category)] \(.content)"' "$RULES_FILE" 2>/dev/null
    echo ""
    
    # Confirm
    read -p "Add these rules to playbook? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Add rules
        echo ""
        echo -e "${YELLOW}Adding rules...${NC}"
        
        if cm playbook add --file "$RULES_FILE" --session "$SESSION"; then
            echo -e "${GREEN}✓ Rules added${NC}"
            
            # Mark done
            if cm onboard mark-done "$SESSION"; then
                echo -e "${GREEN}✓ Session marked complete${NC}"
            fi
            
            # Clean up
            rm -f "$RULES_FILE" "$CONTEXT_FILE" "$PROMPT_FILE"
            
            # Show updated stats
            echo ""
            echo -e "${YELLOW}📊 Updated stats:${NC}"
            cm onboard status
            
            echo ""
            echo -e "${GREEN}✅ Complete! Run again to process next session:${NC}"
            echo -e "   ${YELLOW}bash $0${NC}"
        else
            echo -e "${YELLOW}⚠ Failed to add rules. Check format and try again.${NC}"
        fi
    else
        echo -e "${YELLOW}Cancelled. To revise, edit:${NC}"
        echo "  $RULES_FILE"
        echo ""
        echo "Then re-run:"
        echo "  bash $0"
    fi
else
    echo "Waiting for rules file..."
    echo ""
    echo "After agent responds, save JSON to:"
    echo "  $RULES_FILE"
    echo ""
    echo "Then re-run: bash $0"
fi

echo ""
