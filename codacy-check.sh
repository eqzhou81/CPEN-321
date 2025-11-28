#!/bin/bash

# Codacy Local Check Script
# This script runs Codacy analysis locally before pushing to GitHub

set -e

echo "🔍 Running Codacy analysis..."

# Check if Codacy CLI is installed
if ! command -v codacy-analysis-cli &> /dev/null && [ ! -f "./codacy-analysis-cli" ]; then
    echo "❌ Codacy CLI not found. Installing..."
    
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    if [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    fi
    
    curl -L "https://github.com/codacy/codacy-analysis-cli/releases/latest/download/codacy-analysis-cli-${OS}-${ARCH}.tar.gz" | tar xzv
    chmod +x codacy-analysis-cli
    
    echo "✅ Codacy CLI installed"
fi

# Determine CLI path
CLI_PATH="./codacy-analysis-cli"
if command -v codacy-analysis-cli &> /dev/null; then
    CLI_PATH="codacy-analysis-cli"
fi

# Run analysis
echo "📊 Analyzing code..."
$CLI_PATH analyze \
    --tool detekt \
    --tool eslint \
    --tool eslint-typescript \
    --format json \
    --output codacy-results.json || true

echo ""
echo "✅ Analysis complete!"
echo "📄 Results saved to codacy-results.json"
echo ""
echo "💡 To upload results to Codacy, set CODACY_API_TOKEN and run:"
echo "   $CLI_PATH analyze --upload"

