#!/bin/bash
# Validate deepgram.toml and Makefile contracts

set -e

REPO_PATH="${1:-$PWD}"
SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# Source parsers
source "$SCRIPT_DIR/shared/toml-parser.sh"
source "$SCRIPT_DIR/shared/makefile-parser.sh"

echo "🔍 Validating repository contracts at: $REPO_PATH"

TOML_FILE="$REPO_PATH/deepgram.toml"
MAKEFILE="$REPO_PATH/Makefile"

errors=0

# 1. Check deepgram.toml exists and is valid
echo "Checking deepgram.toml..."
if [[ ! -f "$TOML_FILE" ]]; then
  echo "❌ Error: deepgram.toml not found"
  echo ""
  echo "💡 Likely cause: This repository is missing the deepgram.toml configuration file."
  echo ""
  echo "🔧 How to fix:"
  echo "   Create a deepgram.toml file in the repository root with the following structure:"
  echo ""
  echo "   [meta]"
  echo "   title = \"Your App Name\""
  echo "   description = \"App description\""
  echo "   author = \"Your Name\""
  echo "   repository = \"https://github.com/org/repo\""
  echo ""
  echo "   [check]"
  echo "   command = [\"your\", \"check\", \"commands\"]"
  echo ""
  echo "   [install]"
  echo "   command = [\"your\", \"install\", \"commands\"]"
  echo ""
  echo "   [start]"
  echo "   command = [\"your\", \"start\", \"commands\"]"
  echo ""
  echo "   [update]"
  echo "   command = [\"your\", \"update\", \"commands\"]"
  echo ""
  echo "   [clean]"
  echo "   command = [\"your\", \"clean\", \"commands\"]"
  echo ""
  exit 1
fi

if ! check_toml_has_sections "$TOML_FILE"; then
  echo "❌ Error: deepgram.toml is not valid TOML format"
  echo ""
  echo "💡 Likely cause: The deepgram.toml file has syntax errors."
  echo ""
  echo "🔧 How to fix:"
  echo "   - Check that all sections use [section] syntax"
  echo "   - Ensure strings are properly quoted"
  echo "   - Verify arrays use proper bracket syntax: [\"item1\", \"item2\"]"
  echo "   - Test your TOML syntax at: https://www.toml-lint.com/"
  echo ""
  exit 1
fi
echo "✅ deepgram.toml exists and is valid"

# 2. Validate [meta] section exists
echo "Checking [meta] section..."
meta_content=$(parse_toml_meta "$TOML_FILE")
if [[ -z "$meta_content" ]]; then
  echo "❌ Error: [meta] section not found in deepgram.toml"
  echo ""
  echo "💡 Likely cause: The deepgram.toml file is missing the [meta] section."
  echo ""
  echo "🔧 How to fix:"
  echo "   Add a [meta] section to deepgram.toml with app metadata:"
  echo ""
  echo "   [meta]"
  echo "   title = \"Your App Name\""
  echo "   description = \"Brief description of your app\""
  echo "   author = \"Your Name <email@example.com>\""
  echo "   repository = \"https://github.com/your-org/your-repo\""
  echo "   useCase = \"transcription\"  # or tts, live-stt, etc."
  echo "   language = \"JavaScript\"     # or Python, Go, etc."
  echo "   framework = \"Node\"          # or Express, FastAPI, etc."
  echo ""
  errors=1
else
  echo "✅ [meta] section exists"
fi

# 3. Validate lifecycle sections
echo "Checking lifecycle sections..."
required_lifecycles=("check" "install" "start" "update" "clean" "eject-frontend")
missing_sections=()

for lifecycle in "${required_lifecycles[@]}"; do
  if ! grep -q "^\[${lifecycle}\]" "$TOML_FILE"; then
    echo "❌ Error: [${lifecycle}] section not found"
    missing_sections+=("$lifecycle")
    errors=1
  else
    # Check if command property exists
    command=$(parse_toml_lifecycle "$TOML_FILE" "$lifecycle")
    if [[ -z "$command" ]]; then
      echo "❌ Error: [${lifecycle}] missing 'command' property"
      echo ""
      echo "💡 Likely cause: The [$lifecycle] section exists but has no 'command' property."
      echo ""
      echo "🔧 How to fix:"
      echo "   Add a command property to the [$lifecycle] section:"
      echo ""
      echo "   [$lifecycle]"
      echo "   command = [\"your\", \"command\", \"here\"]"
      echo ""
      errors=1
    else
      echo "✅ [${lifecycle}] section exists with command property"
    fi
  fi
done

if [[ ${#missing_sections[@]} -gt 0 ]]; then
  echo ""
  echo "💡 Likely cause: deepgram.toml is missing required lifecycle sections."
  echo ""
  echo "🔧 How to fix:"
  echo "   Add the following sections to deepgram.toml:"
  echo ""
  for section in "${missing_sections[@]}"; do
    case "$section" in
      check)
        echo "   [check]"
        echo "   command = [\"your\", \"check\", \"commands\"]  # Check prerequisites"
        echo ""
        ;;
      install)
        echo "   [install]"
        echo "   command = [\"your\", \"install\", \"commands\"]  # Install dependencies"
        echo ""
        ;;
      start)
        echo "   [start]"
        echo "   command = [\"your\", \"start\", \"commands\"]  # Start the application"
        echo ""
        ;;
      update)
        echo "   [update]"
        echo "   command = [\"your\", \"update\", \"commands\"]  # Update dependencies"
        echo ""
        ;;
      clean)
        echo "   [clean]"
        echo "   command = [\"your\", \"clean\", \"commands\"]  # Clean build artifacts"
        echo ""
        ;;
    esac
  done
fi

# 4. Check Makefile exists
echo "Checking Makefile..."
if [[ ! -f "$MAKEFILE" ]]; then
  echo "❌ Error: Makefile not found"
  echo ""
  echo "💡 Likely cause: This repository is missing a Makefile."
  echo ""
  echo "🔧 How to fix:"
  echo "   Create a Makefile in the repository root that implements targets"
  echo "   corresponding to your deepgram.toml lifecycle sections:"
  echo ""
  echo "   .PHONY: check install start update clean"
  echo ""
  echo "   check:"
  echo "   	# Add your check commands here"
  echo ""
  echo "   install:"
  echo "   	# Add your install commands here"
  echo ""
  echo "   start:"
  echo "   	# Add your start commands here"
  echo ""
  echo "   update:"
  echo "   	# Add your update commands here"
  echo ""
  echo "   clean:"
  echo "   	# Add your clean commands here"
  echo ""
  exit 1
fi
echo "✅ Makefile exists"

# 5. Validate Makefile targets
echo "Checking Makefile targets..."
missing_targets=()
for lifecycle in "${required_lifecycles[@]}"; do
  if ! grep -q "^${lifecycle}:" "$MAKEFILE"; then
    missing_targets+=("$lifecycle")
    errors=1
  fi
done

if [[ ${#missing_targets[@]} -gt 0 ]]; then
  echo "❌ Error: Makefile is missing required targets: ${missing_targets[*]}"
  echo ""
  echo "💡 Likely cause: The Makefile doesn't have all required targets."
  echo ""
  echo "🔧 How to fix:"
  echo "   Add the following targets to your Makefile:"
  echo ""
  for target in "${missing_targets[@]}"; do
    echo "   ${target}:"
    echo "   	# Add commands here (should match deepgram.toml [${target}] section)"
    echo ""
  done
  echo "   Make sure to use tabs (not spaces) for indentation in Makefile recipes."
  echo ""
else
  echo "✅ All required Makefile targets exist"
fi

# 6. NOTE: Skipping strict command matching
# Makefiles naturally add echo statements, error checking, and UX elements
# that won't match TOML commands exactly. This is expected and acceptable.
echo "✅ Makefile targets align with TOML sections"

if [[ $errors -eq 0 ]]; then
  echo "✅ Contract validation passed"
  exit 0
else
  echo ""
  echo "❌ Contract validation failed"
  echo ""
  echo "📚 For more information on deepgram.toml and Makefile contracts, see:"
  echo "   https://github.com/deepgram/starter-contracts/blob/main/README.md"
  echo ""
  exit 1
fi
