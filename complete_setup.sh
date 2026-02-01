#!/bin/bash
# Complete CASS Memory Setup
# Run this to finish the installation

set -e

echo "🔧 Completing CASS Memory setup..."
echo ""

# Update PATH for current session
export PATH="$HOME/.local/bin:$PATH"

# Verify cm is accessible
if ! command -v cm &> /dev/null; then
    echo "❌ cm not in PATH. Trying to locate..."
    
    # Common installation locations
    if [ -f "$HOME/.local/bin/cm" ]; then
        export PATH="$HOME/.local/bin:$PATH"
        echo "✅ Found at $HOME/.local/bin/cm"
    elif [ -f "/usr/local/bin/cm" ]; then
        export PATH="/usr/local/bin:$PATH"
        echo "✅ Found at /usr/local/bin/cm"
    else
        echo "❌ Cannot find cm binary. Please check installation."
        exit 1
    fi
fi

echo "📋 Checking available starters..."
cm starters || echo "Note: No starters available, using default init"
echo ""

# Initialize without starter (will create empty playbook)
echo "6️⃣  Initializing CASS Memory (default)..."
cm init || echo "Already initialized"
echo ""

# Alternative: Create a basic starter playbook manually
echo "📚 Creating basic starter rules..."
mkdir -p ~/.cass-memory

# Add some universal rules if playbook is empty
cat > /tmp/starter_rules.json << 'EOF'
[
  {
    "content": "Always run tests before committing changes",
    "category": "testing"
  },
  {
    "content": "Check for null/undefined before accessing properties",
    "category": "debugging"
  },
  {
    "content": "Validate inputs at system boundaries (API endpoints, CLI args)",
    "category": "security"
  },
  {
    "content": "Use meaningful variable names that describe intent, not implementation",
    "category": "documentation"
  },
  {
    "content": "AVOID: Committing commented-out code - use version control instead",
    "category": "git"
  }
]
EOF

echo "Adding starter rules to playbook..."
cm playbook add --file /tmp/starter_rules.json 2>&1 || echo "Rules might already exist"
rm -f /tmp/starter_rules.json
echo ""

# Run tests
echo "7️⃣  Running verification tests..."
echo ""

echo "✓ Test 1: Check cm version"
cm --version
echo ""

echo "✓ Test 2: System health check"
cm doctor --json | head -30
echo ""

echo "✓ Test 3: Context retrieval (no LLM needed)"
cm context "fix authentication bug" --json | head -40
echo ""

echo "✓ Test 4: Playbook stats"
cm stats --json
echo ""

echo "✅ Setup verification complete!"
echo ""
echo "📚 Next steps:"
echo ""
echo "1. Reload your shell to pick up the API key:"
echo "   source ~/.bashrc"
echo ""
echo "2. Test LLM integration (uses Abacus AI):"
echo "   cm reflect --days 7 --json"
echo ""
echo "3. View your playbook:"
echo "   cm playbook list"
echo ""
echo "4. Get context for a task:"
echo "   cm context \"implement rate limiting\" --json"
echo ""
echo "5. Add custom rules:"
echo "   cm playbook add \"Your rule here\" --category debugging"
echo ""
echo "🤖 Agent-Native Onboarding (zero API cost):"
echo "   cm onboard status"
echo "   cm onboard sample --fill-gaps"
echo "   cm onboard read /path/to/session.jsonl --template"
echo ""
echo "⚙️  Set up automated reflection (optional):"
echo "   crontab -e"
echo "   # Add: 0 2 * * * $HOME/.local/bin/cm reflect --days 7 >> ~/.cass-memory/reflect.log 2>&1"
echo ""
echo "📖 Documentation:"
echo "   - Full guide: ABACUS_AI_CASS_MEMORY_SETUP.md"
echo "   - Quick reference: QUICK_REFERENCE.md"
echo "   - Config file: ~/.cass-memory/config.json"
