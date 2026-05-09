#!/usr/bin/env bash

# Run Text Intelligence test harness
# This script is designed to be run from a starter app directory (e.g., node-text-intelligence)
# with the contracts repo added as a submodule in the contracts/ directory.
#
# Prerequisites:
# - Starter app must be running on localhost:8080 (frontend) and localhost:8081 (backend)
# - contracts repo must be present as a git submodule in ./contracts/
# - Current working directory must be the starter app root
#
# Usage: ./contracts/tests/run-text-intelligence-app.sh

set -e

# Store the repo root (starter app directory)
REPO_ROOT="$(pwd)"
export REPO_PATH="$REPO_ROOT"

# Check that we're in a starter app directory (should have deepgram.toml and Makefile)
if [[ ! -f "deepgram.toml" ]] || [[ ! -f "Makefile" ]]; then
  echo "❌ Error: Must run from starter app root directory"
  echo "   Expected files: deepgram.toml, Makefile"
  exit 1
fi

# Check that contracts directory exists
if [[ ! -d "contracts" ]]; then
  echo "❌ Error: contracts/ directory not found"
  echo "   Add starter-contracts as a submodule:"
  echo "   git submodule add git@github.com:deepgram/starter-contracts.git contracts"
  exit 1
fi

# Check that the app is running
echo "🔍 Checking if app is running..."
if ! curl -s http://localhost:8080 > /dev/null; then
  echo "❌ Error: App is not running on localhost:8080"
  echo "   Start the app first: make start"
  exit 1
fi

if ! curl -s http://localhost:8081 > /dev/null; then
  echo "❌ Error: App is not running on localhost:8081"
  echo "   Start the app first: make start"
  exit 1
fi

echo "✅ App is running"
echo ""
echo "Running Text Intelligence test harness"
echo "====================================================="

# Track overall test status
TESTS_FAILED=0

# 1. Run structure validation tests (bash)
echo ""
echo "📋 Running structure validation tests..."
echo "---------------------------------------------------"

if ./contracts/tests/text-intelligence/structure/validate-contracts.sh "$REPO_ROOT"; then
  echo "✅ Contracts validation passed"
else
  echo "❌ Contracts validation failed"
  TESTS_FAILED=1
fi

if ./contracts/tests/text-intelligence/structure/validate-frontend.sh "$REPO_ROOT"; then
  echo "✅ Frontend validation passed"
else
  echo "❌ Frontend validation failed"
  TESTS_FAILED=1
fi

# 2. Run API tests (vitest)
echo ""
echo "🧪 Running API tests..."
echo "---------------------------------------------------"

cd "$REPO_ROOT/contracts"

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
  echo "Installing test dependencies..."
  npm install
fi

export BASE_URL="http://localhost:8081"
export REPO_PATH="$REPO_ROOT"

if npm run test:text-intelligence -- tests/text-intelligence/api/; then
  echo "✅ API tests passed"
else
  echo "❌ API tests failed"
  TESTS_FAILED=1
fi

# 3. Run UI tests (playwright)
echo ""
echo "🎭 Running UI tests..."
echo "---------------------------------------------------"

# Reset BASE_URL to frontend port for UI tests
export BASE_URL="http://localhost:8080"

# Check if playwright browsers are installed
if ! npx playwright --version > /dev/null 2>&1; then
  echo "Installing Playwright browsers..."
  npx playwright install
fi

if npx playwright test tests/text-intelligence/ui/workflow.spec.js; then
  echo "✅ UI tests passed"
else
  echo "❌ UI tests failed"
  TESTS_FAILED=1
fi

# Return to original directory
cd "$REPO_ROOT"

echo ""
echo "====================================================="
if [ $TESTS_FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
