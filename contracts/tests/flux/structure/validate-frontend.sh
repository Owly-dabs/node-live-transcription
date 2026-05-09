#!/bin/bash
# Validate frontend submodule setup

set -e

REPO_PATH="${1:-$PWD}"

echo "🔍 Validating frontend submodule at: $REPO_PATH"

errors=0

# 1. Check frontend/ directory exists
if [[ ! -d "$REPO_PATH/frontend" ]]; then
  echo "❌ Error: frontend/ directory not found"
  exit 1
fi
echo "✅ frontend/ directory exists"

# 2. Check if it's a git submodule
if [[ ! -f "$REPO_PATH/.gitmodules" ]]; then
  echo "❌ Error: .gitmodules not found (no submodules configured)"
  errors=1
elif ! grep -q "path = frontend" "$REPO_PATH/.gitmodules"; then
  echo "❌ Error: frontend not configured as submodule in .gitmodules"
  errors=1
else
  echo "✅ frontend is configured as a git submodule"
fi

# 3. Check if submodule is initialized
if [[ ! -f "$REPO_PATH/frontend/.git" && ! -d "$REPO_PATH/frontend/.git" ]]; then
  echo "❌ Error: frontend submodule not initialized (no .git found)"
  errors=1
else
  echo "✅ frontend submodule is initialized"
fi

# 4. Check if submodule directory is not empty
if [[ -z "$(ls -A "$REPO_PATH/frontend" 2>/dev/null)" ]]; then
  echo "❌ Error: frontend submodule is empty"
  errors=1
else
  echo "✅ frontend submodule has content"
fi

if [[ $errors -eq 0 ]]; then
  echo "✅ Frontend validation passed"
  exit 0
else
  echo "❌ Frontend validation failed"
  exit 1
fi
