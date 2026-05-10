#!/bin/bash
# Validate frontend submodule setup

set -e

REPO_PATH="${1:-$PWD}"

echo "🔍 Validating frontend submodule at: $REPO_PATH"

errors=0

# 1. Check frontend/ directory exists
if [[ ! -d "$REPO_PATH/frontend" ]]; then
  echo "❌ Error: frontend/ directory not found"
  echo ""
  echo "💡 Likely cause: The frontend submodule hasn't been added to this repository."
  echo ""
  echo "🔧 How to fix:"
  echo "   Add the frontend as a git submodule:"
  echo ""
  echo "   cd $REPO_PATH"
  echo "   git submodule add https://github.com/deepgram/transcription-html-frontend.git frontend"
  echo "   git submodule update --init --recursive"
  echo ""
  echo "   Then commit the changes:"
  echo "   git add .gitmodules frontend"
  echo "   git commit -m \"feat: add frontend submodule\""
  echo ""
  exit 1
fi
echo "✅ frontend/ directory exists"

# 2. Check if it's a git submodule
if [[ ! -f "$REPO_PATH/.gitmodules" ]]; then
  echo "❌ Error: .gitmodules not found (no submodules configured)"
  echo ""
  echo "💡 Likely cause: The frontend/ directory exists but is not a git submodule."
  echo "   It may have been copied directly instead of added as a submodule."
  echo ""
  echo "🔧 How to fix:"
  echo "   1. Remove the existing frontend directory:"
  echo "      rm -rf frontend"
  echo ""
  echo "   2. Add it as a proper git submodule:"
  echo "      git submodule add https://github.com/deepgram/transcription-html-frontend.git frontend"
  echo "      git submodule update --init --recursive"
  echo ""
  echo "   3. Commit the changes:"
  echo "      git add .gitmodules frontend"
  echo "      git commit -m \"feat: convert frontend to git submodule\""
  echo ""
  errors=1
elif ! grep -q "path = frontend" "$REPO_PATH/.gitmodules"; then
  echo "❌ Error: frontend not configured as submodule in .gitmodules"
  echo ""
  echo "💡 Likely cause: .gitmodules exists but doesn't list frontend as a submodule."
  echo ""
  echo "🔧 How to fix:"
  echo "   Add the frontend submodule:"
  echo ""
  echo "   cd $REPO_PATH"
  echo "   git submodule add https://github.com/deepgram/transcription-html-frontend.git frontend"
  echo "   git submodule update --init --recursive"
  echo ""
  errors=1
else
  echo "✅ frontend is configured as a git submodule"
fi

# 3. Check if submodule is initialized
if [[ ! -f "$REPO_PATH/frontend/.git" && ! -d "$REPO_PATH/frontend/.git" ]]; then
  echo "❌ Error: frontend submodule not initialized (no .git found)"
  echo ""
  echo "💡 Likely cause: The submodule is registered in .gitmodules but hasn't been initialized."
  echo "   This commonly happens after cloning a repo without --recursive flag."
  echo ""
  echo "🔧 How to fix:"
  echo "   Initialize and update the submodule:"
  echo ""
  echo "   cd $REPO_PATH"
  echo "   git submodule init"
  echo "   git submodule update"
  echo ""
  echo "   Or in one command:"
  echo "   git submodule update --init --recursive"
  echo ""
  errors=1
else
  echo "✅ frontend submodule is initialized"
fi

# 4. Check if submodule directory is not empty
if [[ -z "$(ls -A "$REPO_PATH/frontend" 2>/dev/null)" ]]; then
  echo "❌ Error: frontend submodule is empty"
  echo ""
  echo "💡 Likely cause: The submodule was initialized but the files weren't downloaded."
  echo ""
  echo "🔧 How to fix:"
  echo "   Update the submodule to download its content:"
  echo ""
  echo "   cd $REPO_PATH"
  echo "   git submodule update --init --recursive"
  echo ""
  echo "   If that doesn't work, try:"
  echo "   git submodule deinit -f frontend"
  echo "   git submodule update --init --recursive"
  echo ""
  errors=1
else
  echo "✅ frontend submodule has content"
fi

if [[ $errors -eq 0 ]]; then
  echo "✅ Frontend validation passed"
  exit 0
else
  echo ""
  echo "❌ Frontend validation failed"
  echo ""
  echo "📚 For more information on git submodules, see:"
  echo "   https://git-scm.com/book/en/v2/Git-Tools-Submodules"
  echo ""
  exit 1
fi
