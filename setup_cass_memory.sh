#!/bin/bash
# CASS Memory Setup Script for Abacus AI
# Usage: bash setup_cass_memory.sh <your_abacus_api_key>

set -e

API_KEY="$1"

if [ -z "$API_KEY" ]; then
    echo "❌ Error: API key required"
    echo "Usage: $0 <your_abacus_api_key>"
    exit 1
fi

echo "🚀 Setting up CASS Memory with Abacus AI..."
echo ""

# 1. Check if CASS is installed
echo "1️⃣  Checking CASS installation..."
if ! command -v cass &> /dev/null; then
    echo "❌ CASS not found. Please install CASS first:"
    echo "   https://github.com/Dicklesworthstone/coding_agent_session_search"
    exit 1
fi
echo "✅ CASS is installed"
echo ""

# 2. Install CASS Memory
echo "2️⃣  Installing CASS Memory..."
if command -v brew &> /dev/null; then
    echo "Using Homebrew..."
    brew install dicklesworthstone/tap/cm || true
elif command -v scoop &> /dev/null; then
    echo "Using Scoop..."
    scoop bucket add dicklesworthstone https://github.com/Dicklesworthstone/scoop-bucket
    scoop install dicklesworthstone/cm
else
    echo "Using install script..."
    curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/cass_memory_system/main/install.sh?$(date +%s)" \
        | bash -s -- --easy-mode --verify
fi
echo ""

# 3. Create config directory
echo "3️⃣  Creating config directory..."
mkdir -p ~/.cass-memory
echo "✅ Config directory created"
echo ""

# 4. Write config file
echo "4️⃣  Writing configuration..."
cat > ~/.cass-memory/config.json << 'EOF'
{
  "provider": "openai",
  "model": "gpt-5.1-codex",
  "openaiBaseUrl": "https://routellm.abacus.ai/v1",
  
  "budget": {
    "dailyLimit": 0.10,
    "monthlyLimit": 2.00,
    "warningThreshold": 80
  },

  "scoring": {
    "decayHalfLifeDays": 90,
    "harmfulMultiplier": 4,
    "minFeedbackForActive": 3,
    "minHelpfulForProven": 10,
    "maxHarmfulRatioForProven": 0.1
  },

  "maxBulletsInContext": 50,
  "maxHistoryInContext": 10,
  "sessionLookbackDays": 7,
  "minRelevanceScore": 0.1,

  "crossAgent": {
    "enabled": true,
    "consentGiven": true,
    "agents": ["codex", "claude", "cursor", "abacus"],
    "auditLog": true
  },

  "semanticSearchEnabled": false,
  "semanticWeight": 0.6,
  "embeddingModel": "Xenova/all-MiniLM-L6-v2",
  "dedupSimilarityThreshold": 0.85,

  "cassPath": "cass",
  "remoteCass": {
    "enabled": false,
    "hosts": []
  }
}
EOF
echo "✅ Configuration written to ~/.cass-memory/config.json"
echo ""

# 5. Set up environment variable
echo "5️⃣  Setting up environment variable..."

# Detect shell
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

if [ -n "$SHELL_CONFIG" ]; then
    # Check if already exists
    if grep -q "OPENAI_API_KEY.*abacus" "$SHELL_CONFIG" 2>/dev/null; then
        echo "⚠️  API key already configured in $SHELL_CONFIG"
    else
        echo "" >> "$SHELL_CONFIG"
        echo "# Abacus AI API Key for CASS Memory" >> "$SHELL_CONFIG"
        echo "export OPENAI_API_KEY=\"$API_KEY\"" >> "$SHELL_CONFIG"
        echo "✅ API key added to $SHELL_CONFIG"
    fi
    
    # Set for current session
    export OPENAI_API_KEY="$API_KEY"
else
    echo "⚠️  Could not detect shell config file. Please add manually:"
    echo "   export OPENAI_API_KEY=\"$API_KEY\""
fi
echo ""

# 6. Initialize CASS Memory
echo "6️⃣  Initializing CASS Memory..."
cm init --starter typescript
echo "✅ CASS Memory initialized with TypeScript starter"
echo ""

# 7. Run tests
echo "7️⃣  Running tests..."
echo ""

echo "Test 1: Context retrieval (no LLM needed)"
cm context "fix authentication bug" --json | head -20
echo ""

echo "Test 2: Playbook stats"
cm stats --json
echo ""

echo "Test 3: CASS integration"
cm doctor --json | head -50
echo ""

# 8. Success message
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Reload your shell: source $SHELL_CONFIG"
echo "   2. Test reflection: cm reflect --days 7 --json"
echo "   3. View playbook: cm playbook list"
echo "   4. Get context: cm context \"your task description\" --json"
echo ""
echo "📖 Full documentation: ~/.cass-memory/ABACUS_AI_SETUP.md"
echo ""
echo "🔄 To set up automated daily reflection:"
echo "   crontab -e"
echo "   # Add: 0 2 * * * /usr/local/bin/cm reflect --days 7 >> ~/.cass-memory/reflect.log 2>&1"
