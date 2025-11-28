# Codacy Local Setup Guide

This guide explains how to set up Codacy to catch errors locally before pushing to GitHub.

## Option 1: Using Codacy CLI (Recommended)

### Installation

1. **Download Codacy CLI:**
   ```bash
   # For macOS/Linux
   curl -L https://github.com/codacy/codacy-analysis-cli/releases/latest/download/codacy-analysis-cli-$(uname -s | tr '[:upper:]' '[:lower:]').tar.gz | tar xzv
   chmod +x codacy-analysis-cli
   
   # Or use npm
   npm install -g @codacy/codacy-analysis-cli
   ```

2. **Get your Codacy API token:**
   - Go to https://app.codacy.com
   - Navigate to your project settings
   - Go to Integrations → API Tokens
   - Copy your API token

3. **Set the token as an environment variable:**
   ```bash
   export CODACY_API_TOKEN="your-token-here"
   ```

### Running Codacy Locally

```bash
# Run analysis on all files
./codacy-analysis-cli analyze

# Run analysis on specific files
./codacy-analysis-cli analyze --tool detekt --tool eslint

# Run analysis and send results to Codacy
./codacy-analysis-cli analyze --upload
```

## Option 2: Using Pre-commit Hook

1. **Install pre-commit:**
   ```bash
   pip install pre-commit
   # or
   brew install pre-commit
   ```

2. **Create `.pre-commit-config.yaml` in the root directory:**
   ```yaml
   repos:
     - repo: https://github.com/codacy/codacy-analysis-cli
       rev: latest
       hooks:
         - id: codacy-analysis-cli
           args: ['analyze', '--tool', 'detekt', '--tool', 'eslint']
   ```

3. **Install the hook:**
   ```bash
   pre-commit install
   ```

4. **Test the hook:**
   ```bash
   pre-commit run --all-files
   ```

## Option 3: Using GitHub Actions (Already Configured)

A GitHub Actions workflow (`.github/workflows/codacy-check.yml`) is already set up to run Codacy checks on pull requests and pushes to main.

To enable it:
1. Go to your GitHub repository settings
2. Navigate to Secrets and variables → Actions
3. Add a new secret named `CODACY_API_TOKEN` with your Codacy API token

## Option 4: Using VS Code Extension

1. Install the "Codacy" extension from the VS Code marketplace
2. Configure it with your API token
3. It will show Codacy issues directly in your editor

## Quick Check Script

You can also create a simple script to run Codacy checks:

```bash
#!/bin/bash
# codacy-check.sh

if [ -z "$CODACY_API_TOKEN" ]; then
    echo "Error: CODACY_API_TOKEN not set"
    echo "Set it with: export CODACY_API_TOKEN='your-token'"
    exit 1
fi

./codacy-analysis-cli analyze --tool detekt --tool eslint --tool eslint-typescript
```

Make it executable:
```bash
chmod +x codacy-check.sh
```

Then run:
```bash
./codacy-check.sh
```

## Notes

- The Codacy configuration is in `.codacy.yml`
- Detekt configuration is in `detekt.yml` (for Kotlin)
- ESLint configuration should be in your project (for TypeScript/JavaScript)
- Codacy will automatically detect and use these configuration files

