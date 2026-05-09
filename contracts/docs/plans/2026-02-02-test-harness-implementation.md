# Test Harness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive test harness that validates Deepgram starter apps against NODE and TRANSCRIPTION requirements

**Architecture:** Multi-framework test suite with bash orchestrators running structure validation (bash scripts), API conformance tests (vitest), and UI workflow tests (playwright). Tests run from app directory against running app at BASE_URL.

**Tech Stack:** Bash (structure validation), Vitest (API tests), Playwright (UI tests), string-similarity (fuzzy matching)

---

## Task 1: Setup Dependencies

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.js`

**Step 1: Add new dependencies**

```bash
pnpm add -D @playwright/test string-similarity
```

**Step 2: Install Playwright browsers**

Run: `pnpm exec playwright install chromium`
Expected: Chromium browser installed successfully

**Step 3: Update vitest config to include REPO_PATH**

In `vitest.config.js`, add REPO_PATH to env:

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      // Allow environment variables to be passed through
      BASE_URL: process.env.BASE_URL,
      WS_BASE_URL: process.env.WS_BASE_URL,
      AUTH_TOKEN: process.env.AUTH_TOKEN,
      REPO_PATH: process.env.REPO_PATH,
    },
  },
});
```

**Step 4: Create playwright config**

Create: `playwright.config.js`

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.js playwright.config.js
git commit -m "chore: add playwright and string-similarity dependencies"
```

---

## Task 2: Create Directory Structure

**Files:**
- Create: `tests/` directory structure

**Step 1: Create directory tree**

```bash
mkdir -p tests/{node/shared,transcription/{structure,api,ui},shared}
```

**Step 2: Verify structure**

Run: `ls -R tests/`
Expected: All directories created

**Step 3: Create placeholder .gitkeep files**

```bash
touch tests/node/shared/.gitkeep
touch tests/transcription/structure/.gitkeep
touch tests/transcription/api/.gitkeep
touch tests/transcription/ui/.gitkeep
touch tests/shared/.gitkeep
```

**Step 4: Commit**

```bash
git add tests/
git commit -m "chore: create test harness directory structure"
```

---

## Task 3: Shared Utilities - TOML Parser

**Files:**
- Create: `tests/shared/toml-parser.sh`

**Step 1: Write TOML parser utility**

Create `tests/shared/toml-parser.sh`:

```bash
#!/bin/bash
# TOML parser utilities for deepgram.toml

# Extract [meta] section as key=value pairs
parse_toml_meta() {
  local toml_file="$1"

  if [[ ! -f "$toml_file" ]]; then
    echo "Error: TOML file not found: $toml_file" >&2
    return 1
  fi

  # Extract [meta] section until next section or EOF
  sed -n '/^\[meta\]/,/^\[/p' "$toml_file" | \
    grep -v '^\[' | \
    grep -v '^#' | \
    grep -v '^$' | \
    sed 's/^[[:space:]]*//' | \
    sed 's/[[:space:]]*$//'
}

# Extract specific lifecycle command
# Usage: parse_toml_lifecycle <toml_file> <lifecycle_name>
# Example: parse_toml_lifecycle deepgram.toml "install"
parse_toml_lifecycle() {
  local toml_file="$1"
  local lifecycle_name="$2"

  if [[ ! -f "$toml_file" ]]; then
    echo "Error: TOML file not found: $toml_file" >&2
    return 1
  fi

  # Extract specific lifecycle section and get command value
  sed -n "/^\[lifecycle\.${lifecycle_name}\]/,/^\[/p" "$toml_file" | \
    grep '^command' | \
    sed 's/command[[:space:]]*=[[:space:]]*//' | \
    sed 's/^"//' | \
    sed 's/"$//'
}

# Check if TOML file is valid (basic check)
validate_toml() {
  local toml_file="$1"

  if [[ ! -f "$toml_file" ]]; then
    echo "Error: TOML file not found: $toml_file" >&2
    return 1
  fi

  # Basic validation: check for balanced brackets
  local open_brackets=$(grep -c '^\[' "$toml_file")

  if [[ $open_brackets -eq 0 ]]; then
    echo "Error: No sections found in TOML file" >&2
    return 1
  fi

  return 0
}

# List all lifecycle sections
list_toml_lifecycles() {
  local toml_file="$1"

  if [[ ! -f "$toml_file" ]]; then
    echo "Error: TOML file not found: $toml_file" >&2
    return 1
  fi

  grep '^\[lifecycle\.' "$toml_file" | \
    sed 's/^\[lifecycle\.//' | \
    sed 's/\]$//'
}
```

**Step 2: Make executable**

```bash
chmod +x tests/shared/toml-parser.sh
```

**Step 3: Commit**

```bash
git add tests/shared/toml-parser.sh
git commit -m "feat(tests): add TOML parser utility"
```

---

## Task 4: Shared Utilities - Makefile Parser

**Files:**
- Create: `tests/shared/makefile-parser.sh`

**Step 1: Write Makefile parser utility**

Create `tests/shared/makefile-parser.sh`:

```bash
#!/bin/bash
# Makefile parser utilities

# List all Makefile targets
list_makefile_targets() {
  local makefile="$1"

  if [[ ! -f "$makefile" ]]; then
    echo "Error: Makefile not found: $makefile" >&2
    return 1
  fi

  # Extract targets (lines ending with :)
  grep -E '^[a-zA-Z0-9_-]+:' "$makefile" | \
    sed 's/:.*//' | \
    sort
}

# Get command for specific target
# Usage: get_makefile_command <makefile> <target>
get_makefile_command() {
  local makefile="$1"
  local target="$2"

  if [[ ! -f "$makefile" ]]; then
    echo "Error: Makefile not found: $makefile" >&2
    return 1
  fi

  # Extract target and get first command line (indented with tab)
  awk -v target="$target:" '
    $0 == target { getline; if ($0 ~ /^\t/) { sub(/^\t/, ""); print; exit } }
  ' "$makefile"
}

# Check if Makefile target exists
target_exists() {
  local makefile="$1"
  local target="$2"

  if [[ ! -f "$makefile" ]]; then
    return 1
  fi

  grep -q "^${target}:" "$makefile"
}

# Validate Makefile has required targets
validate_makefile_targets() {
  local makefile="$1"
  shift
  local required_targets=("$@")

  if [[ ! -f "$makefile" ]]; then
    echo "Error: Makefile not found: $makefile" >&2
    return 1
  fi

  local missing_targets=()

  for target in "${required_targets[@]}"; do
    if ! target_exists "$makefile" "$target"; then
      missing_targets+=("$target")
    fi
  done

  if [[ ${#missing_targets[@]} -gt 0 ]]; then
    echo "Error: Missing required Makefile targets: ${missing_targets[*]}" >&2
    return 1
  fi

  return 0
}
```

**Step 2: Make executable**

```bash
chmod +x tests/shared/makefile-parser.sh
```

**Step 3: Commit**

```bash
git add tests/shared/makefile-parser.sh
git commit -m "feat(tests): add Makefile parser utility"
```

---

## Task 5: Shared Utilities - JavaScript Helpers

**Files:**
- Create: `tests/shared/test-helpers.js`

**Step 1: Write JavaScript test helpers**

Create `tests/shared/test-helpers.js`:

```javascript
import fs from 'fs';
import path from 'path';

/**
 * Simple TOML parser for deepgram.toml [meta] section
 * @param {string} filePath - Path to TOML file
 * @returns {Object} Parsed TOML with meta section
 */
export function parseToml(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`TOML file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Parse [meta] section
  const metaMatch = content.match(/\[meta\]([\s\S]*?)(?=\n\[|$)/);
  const meta = {};

  if (metaMatch) {
    metaMatch[1].split('\n').forEach(line => {
      // Match key = "value" or key = value
      const match = line.match(/^\s*(\w+)\s*=\s*"?([^"]*)"?\s*$/);
      if (match && match[1] && match[2]) {
        meta[match[1]] = match[2];
      }
    });
  }

  return { meta };
}

/**
 * Normalize text for comparison (lowercase, collapse whitespace)
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Environment variables with defaults
 */
export const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
export const REPO_PATH = process.env.REPO_PATH || process.cwd();
```

**Step 2: Commit**

```bash
git add tests/shared/test-helpers.js
git commit -m "feat(tests): add JavaScript test helper utilities"
```

---

## Task 6: Node Tests - .npmrc Validation

**Files:**
- Create: `tests/node/shared/npmrc-rules.txt`
- Create: `tests/node/validate-npmrc.sh`

**Step 1: Create .npmrc rules reference**

Create `tests/node/shared/npmrc-rules.txt`:

```
node-linker=pnpm
ignore-scripts=true
enable-pre-post-scripts=false
minimum-release-age=14400
verify-store-integrity=true
trust-policy=strict
strict-peer-dependencies=true
symlink=true
frozen-lockfile=false
```

**Step 2: Write .npmrc validation script**

Create `tests/node/validate-npmrc.sh`:

```bash
#!/bin/bash
# Validate .npmrc security settings

set -e

REPO_PATH="${1:-$PWD}"
NPMRC_FILE="$REPO_PATH/.npmrc"
RULES_FILE="$(dirname "$0")/shared/npmrc-rules.txt"

echo "🔍 Validating .npmrc at: $NPMRC_FILE"

# Check .npmrc exists
if [[ ! -f "$NPMRC_FILE" ]]; then
  echo "❌ Error: .npmrc not found at $NPMRC_FILE"
  exit 1
fi

# Read required rules
if [[ ! -f "$RULES_FILE" ]]; then
  echo "❌ Error: Rules file not found at $RULES_FILE"
  exit 1
fi

# Validate each required setting
missing_settings=()
incorrect_settings=()

while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^# ]] && continue

  # Check if setting exists in .npmrc
  if ! grep -q "^${key}=" "$NPMRC_FILE"; then
    missing_settings+=("$key=$value")
  else
    # Check if value matches
    actual_value=$(grep "^${key}=" "$NPMRC_FILE" | sed 's/^[^=]*=//')
    if [[ "$actual_value" != "$value" ]]; then
      incorrect_settings+=("$key: expected '$value', got '$actual_value'")
    fi
  fi
done < "$RULES_FILE"

# Report results
errors=0

if [[ ${#missing_settings[@]} -gt 0 ]]; then
  echo "❌ Missing required .npmrc settings:"
  printf '   - %s\n' "${missing_settings[@]}"
  errors=1
fi

if [[ ${#incorrect_settings[@]} -gt 0 ]]; then
  echo "❌ Incorrect .npmrc settings:"
  printf '   - %s\n' "${incorrect_settings[@]}"
  errors=1
fi

if [[ $errors -eq 0 ]]; then
  echo "✅ .npmrc validation passed"
  exit 0
else
  echo "❌ .npmrc validation failed"
  exit 1
fi
```

**Step 3: Make executable**

```bash
chmod +x tests/node/validate-npmrc.sh
```

**Step 4: Commit**

```bash
git add tests/node/shared/npmrc-rules.txt tests/node/validate-npmrc.sh
git commit -m "feat(tests): add .npmrc validation for Node apps"
```

---

## Task 7: Node Tests - Structure Validation

**Files:**
- Create: `tests/node/validate-structure.sh`

**Step 1: Write structure validation script**

Create `tests/node/validate-structure.sh`:

```bash
#!/bin/bash
# Validate Node.js project structure

set -e

REPO_PATH="${1:-$PWD}"

echo "🔍 Validating Node.js project structure at: $REPO_PATH"

errors=0

# Check package.json exists and is valid JSON
if [[ ! -f "$REPO_PATH/package.json" ]]; then
  echo "❌ Error: package.json not found"
  errors=1
elif ! jq empty "$REPO_PATH/package.json" 2>/dev/null; then
  echo "❌ Error: package.json is not valid JSON"
  errors=1
else
  echo "✅ package.json exists and is valid JSON"

  # Check required fields
  for field in name version scripts; do
    if ! jq -e ".$field" "$REPO_PATH/package.json" >/dev/null 2>&1; then
      echo "❌ Error: package.json missing required field: $field"
      errors=1
    fi
  done
fi

# Check pnpm-lock.yaml exists (enforces pnpm usage)
if [[ ! -f "$REPO_PATH/pnpm-lock.yaml" ]]; then
  echo "❌ Error: pnpm-lock.yaml not found (project must use pnpm)"
  errors=1
else
  echo "✅ pnpm-lock.yaml exists"
fi

# Check node_modules exists (dependencies installed)
if [[ ! -d "$REPO_PATH/node_modules" ]]; then
  echo "⚠️  Warning: node_modules not found (dependencies may not be installed)"
  # Not a hard error - might be intentional
else
  echo "✅ node_modules exists"
fi

# Final result
if [[ $errors -eq 0 ]]; then
  echo "✅ Node.js structure validation passed"
  exit 0
else
  echo "❌ Node.js structure validation failed"
  exit 1
fi
```

**Step 2: Make executable**

```bash
chmod +x tests/node/validate-structure.sh
```

**Step 3: Commit**

```bash
git add tests/node/validate-structure.sh
git commit -m "feat(tests): add Node.js structure validation"
```

---

## Task 8: Transcription Tests - Contract Validation

**Files:**
- Create: `tests/transcription/structure/validate-contracts.sh`

**Step 1: Write contract validation script**

Create `tests/transcription/structure/validate-contracts.sh`:

```bash
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
  exit 1
fi

if ! validate_toml "$TOML_FILE"; then
  echo "❌ Error: deepgram.toml is not valid"
  exit 1
fi
echo "✅ deepgram.toml exists and is valid"

# 2. Validate [meta] section exists
echo "Checking [meta] section..."
meta_content=$(parse_toml_meta "$TOML_FILE")
if [[ -z "$meta_content" ]]; then
  echo "❌ Error: [meta] section not found in deepgram.toml"
  errors=1
else
  echo "✅ [meta] section exists"
fi

# 3. Validate lifecycle sections
echo "Checking lifecycle sections..."
required_lifecycles=("check" "install" "start" "update" "clean" "test")

for lifecycle in "${required_lifecycles[@]}"; do
  if ! grep -q "^\[lifecycle\.${lifecycle}\]" "$TOML_FILE"; then
    echo "❌ Error: [lifecycle.${lifecycle}] section not found"
    errors=1
  else
    # Check if command property exists
    command=$(parse_toml_lifecycle "$TOML_FILE" "$lifecycle")
    if [[ -z "$command" ]]; then
      echo "❌ Error: [lifecycle.${lifecycle}] missing 'command' property"
      errors=1
    else
      echo "✅ [lifecycle.${lifecycle}] exists with command: $command"
    fi
  fi
done

# 4. Check Makefile exists
echo "Checking Makefile..."
if [[ ! -f "$MAKEFILE" ]]; then
  echo "❌ Error: Makefile not found"
  exit 1
fi
echo "✅ Makefile exists"

# 5. Validate Makefile targets
echo "Checking Makefile targets..."
if ! validate_makefile_targets "$MAKEFILE" "${required_lifecycles[@]}"; then
  errors=1
else
  echo "✅ All required Makefile targets exist"
fi

# 6. STRICT: Validate Makefile commands match TOML
echo "Validating Makefile/TOML alignment..."
for lifecycle in "${required_lifecycles[@]}"; do
  toml_command=$(parse_toml_lifecycle "$TOML_FILE" "$lifecycle" | xargs)
  make_command=$(get_makefile_command "$MAKEFILE" "$lifecycle" | xargs)

  if [[ -n "$toml_command" && -n "$make_command" ]]; then
    # Compare commands (normalize whitespace)
    if [[ "$toml_command" != "$make_command" ]]; then
      echo "❌ Mismatch for '$lifecycle':"
      echo "   TOML: $toml_command"
      echo "   Make: $make_command"
      errors=1
    fi
  fi
done

if [[ $errors -eq 0 ]]; then
  echo "✅ Contract validation passed"
  exit 0
else
  echo "❌ Contract validation failed"
  exit 1
fi
```

**Step 2: Make executable**

```bash
chmod +x tests/transcription/structure/validate-contracts.sh
```

**Step 3: Commit**

```bash
git add tests/transcription/structure/validate-contracts.sh
git commit -m "feat(tests): add deepgram.toml/Makefile contract validation"
```

---

## Task 9: Transcription Tests - Frontend Validation

**Files:**
- Create: `tests/transcription/structure/validate-frontend.sh`

**Step 1: Write frontend validation script**

Create `tests/transcription/structure/validate-frontend.sh`:

```bash
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
```

**Step 2: Make executable**

```bash
chmod +x tests/transcription/structure/validate-frontend.sh
```

**Step 3: Commit**

```bash
git add tests/transcription/structure/validate-frontend.sh
git commit -m "feat(tests): add frontend submodule validation"
```

---

## Task 10: Transcription Tests - Metadata API Test

**Files:**
- Create: `tests/transcription/api/util.js`
- Create: `tests/transcription/api/metadata.test.js`

**Step 1: Create API test utilities**

Create `tests/transcription/api/util.js`:

```javascript
export const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
export const REPO_PATH = process.env.REPO_PATH || process.cwd();
```

**Step 2: Write metadata API test**

Create `tests/transcription/api/metadata.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { parseToml } from '../../shared/test-helpers.js';
import { BASE_URL, REPO_PATH } from './util.js';
import path from 'path';

describe('Metadata API Contract', () => {
  it('should return metadata matching deepgram.toml [meta] section', async () => {
    // 1. Parse deepgram.toml [meta] section
    const tomlPath = path.join(REPO_PATH, 'deepgram.toml');
    const { meta: tomlMeta } = parseToml(tomlPath);

    expect(tomlMeta).toBeDefined();
    expect(Object.keys(tomlMeta).length).toBeGreaterThan(0);

    // 2. GET /api/metadata
    const response = await fetch(`${BASE_URL}/api/metadata`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toMatch(/application\/json/);

    const apiMeta = await response.json();
    expect(apiMeta).toBeDefined();

    // 3. EXACT MATCH: validate each field from TOML exists in API response
    Object.keys(tomlMeta).forEach(key => {
      expect(apiMeta).toHaveProperty(key);
      expect(apiMeta[key]).toBe(tomlMeta[key]);
    });
  });

  it('should return 200 OK for metadata endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/metadata`);
    expect(response.status).toBe(200);
  });
});
```

**Step 3: Commit**

```bash
git add tests/transcription/api/util.js tests/transcription/api/metadata.test.js
git commit -m "feat(tests): add metadata API validation test"
```

---

## Task 11: Transcription Tests - Reuse STT Conformance

**Files:**
- Create: `tests/transcription/api/transcribe.test.js`

**Step 1: Write transcribe test wrapper**

Create `tests/transcription/api/transcribe.test.js`:

```javascript
// Reuse existing STT conformance tests
// This imports and runs the existing tests in this test suite context
import '../../../interfaces/stt/conformance/transcribe.spec.js';
```

**Step 2: Commit**

```bash
git add tests/transcription/api/transcribe.test.js
git commit -m "feat(tests): add transcription API test (reuses STT conformance)"
```

---

## Task 12: Transcription Tests - UI Workflow Test

**Files:**
- Create: `tests/transcription/ui/workflow.spec.js`

**Step 1: Write Playwright UI test**

Create `tests/transcription/ui/workflow.spec.js`:

```javascript
import { test, expect } from '@playwright/test';
import { compareTwoStrings } from 'string-similarity';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const SIMILARITY_THRESHOLD = 0.85; // 85% match required

// Stanford debate audio transcript (from card-spacewalk)
const EXPECTED_TRANSCRIPT = `so the logic behind this article he said please pirate my cut my songs because if everybody knows my songs and everybody comes to my concerts i'll make much more money than if everybody buys my records and it makes sense you know so another problem the big five record labels distributed eighty five percent of music that is distributed worldwide`;

test.describe('Transcription UI Workflow', () => {
  test('should complete full transcription workflow via UI', async ({ page }) => {
    // 1. Navigate to app
    await page.goto(BASE_URL);

    // 2. Wait for page to load and card to be enabled
    await page.waitForSelector('#card-spacewalk', { state: 'visible' });
    await page.waitForSelector('#card-spacewalk:not([class*="disabled"])', {
      timeout: 5000
    });

    // 3. Select spacewalk audio (Stanford debate)
    await page.locator('#card-spacewalk').click();

    // 4. Wait for transcribe button to be enabled and click
    await page.waitForSelector('#transcribeBtn:not([disabled])', {
      timeout: 5000
    });
    await page.locator('#transcribeBtn').click();

    // 5. Wait for results to appear (look for distinctive phrase)
    await page.waitForSelector('text=/pirate|concert|record/i', {
      timeout: 30000
    });

    // 6. Extract transcript text from page
    const transcriptText = await page.textContent('body');

    // 7. Normalize both texts (lowercase, collapse whitespace)
    const normalizedTranscript = transcriptText
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedExpected = EXPECTED_TRANSCRIPT
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // 8. Fuzzy match with similarity threshold
    const similarity = compareTwoStrings(normalizedTranscript, normalizedExpected);

    console.log(`Transcript similarity: ${(similarity * 100).toFixed(2)}%`);
    expect(similarity).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD);
  });

  test('should have required UI elements', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for required elements
    await expect(page.locator('#card-spacewalk')).toBeVisible();
    await expect(page.locator('#transcribeBtn')).toBeVisible();
  });
});
```

**Step 2: Commit**

```bash
git add tests/transcription/ui/workflow.spec.js
git commit -m "feat(tests): add Playwright UI workflow test with fuzzy matching"
```

---

## Task 13: Node Test Orchestrator

**Files:**
- Create: `tests/run-node-app.sh`

**Step 1: Write Node test orchestrator**

Create `tests/run-node-app.sh`:

```bash
#!/bin/bash
# Node Test Suite Orchestrator
# Usage: ./tests/run-node-app.sh <BASE_URL> [REPO_PATH]

set -e

BASE_URL="$1"
REPO_PATH="${2:-$PWD}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <BASE_URL> [REPO_PATH]"
  echo ""
  echo "Example:"
  echo "  cd ~/node-transcription"
  echo "  ~/starter-contracts/tests/run-node-app.sh http://localhost:8080"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "======================================"
echo "🧪 Node Test Suite"
echo "======================================"
echo "App URL: $BASE_URL"
echo "Repo Path: $REPO_PATH"
echo ""

# Run Node-specific tests
echo "🔍 Validating .npmrc security settings..."
bash "$SCRIPT_DIR/node/validate-npmrc.sh" "$REPO_PATH"
echo ""

echo "🔍 Validating Node.js project structure..."
bash "$SCRIPT_DIR/node/validate-structure.sh" "$REPO_PATH"
echo ""

echo "======================================"
echo "✅ All Node tests passed!"
echo "======================================"
```

**Step 2: Make executable**

```bash
chmod +x tests/run-node-app.sh
```

**Step 3: Commit**

```bash
git add tests/run-node-app.sh
git commit -m "feat(tests): add Node test orchestrator script"
```

---

## Task 14: Transcription Test Orchestrator

**Files:**
- Create: `tests/run-transcription-app.sh`

**Step 1: Write Transcription test orchestrator**

Create `tests/run-transcription-app.sh`:

```bash
#!/bin/bash
# Transcription Test Suite Orchestrator
# Usage: ./tests/run-transcription-app.sh <BASE_URL> [REPO_PATH]

set -e

BASE_URL="$1"
REPO_PATH="${2:-$PWD}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <BASE_URL> [REPO_PATH]"
  echo ""
  echo "Example:"
  echo "  cd ~/node-transcription"
  echo "  ~/starter-contracts/tests/run-transcription-app.sh http://localhost:8080"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "======================================"
echo "🎤 Transcription Test Suite"
echo "======================================"
echo "App URL: $BASE_URL"
echo "Repo Path: $REPO_PATH"
echo ""

# 1. Structure validation
echo "🔍 Validating repository structure..."
bash "$SCRIPT_DIR/transcription/structure/validate-contracts.sh" "$REPO_PATH"
echo ""

bash "$SCRIPT_DIR/transcription/structure/validate-frontend.sh" "$REPO_PATH"
echo ""

# 2. API conformance tests
echo "🧪 Running API conformance tests..."
cd "$PROJECT_ROOT"
BASE_URL="$BASE_URL" REPO_PATH="$REPO_PATH" pnpm vitest run tests/transcription/api/
echo ""

# 3. UI workflow tests
echo "🎭 Running UI workflow tests..."
cd "$PROJECT_ROOT"
BASE_URL="$BASE_URL" pnpm playwright test tests/transcription/ui/
echo ""

echo "======================================"
echo "✅ All Transcription tests passed!"
echo "======================================"
```

**Step 2: Make executable**

```bash
chmod +x tests/run-transcription-app.sh
```

**Step 3: Commit**

```bash
git add tests/run-transcription-app.sh
git commit -m "feat(tests): add Transcription test orchestrator script"
```

---

## Task 15: Add npm Scripts for Convenience

**Files:**
- Modify: `package.json`

**Step 1: Add test harness npm scripts**

In `package.json`, add to the `scripts` section:

```json
{
  "scripts": {
    "test:stt": "vitest run interfaces/stt/conformance/transcribe.spec.js",
    "test:tts": "vitest run interfaces/tts/conformance/synthesize.spec.js",
    "test:text-intelligence": "vitest run interfaces/text-intelligence/conformance/analyze.spec.js",
    "test:live-stt": "vitest run interfaces/live-stt/conformance/stream.spec.js",
    "test:live-tts": "vitest run interfaces/live-tts/conformance/synthesize.spec.js",
    "test:flux": "vitest run interfaces/flux/conformance/stream.spec.js",
    "test:agent": "vitest run interfaces/agent/conformance/converse.spec.js",
    "test:harness:node-api": "vitest run tests/transcription/api/",
    "test:harness:ui": "playwright test tests/transcription/ui/",
    "test:harness:node": "./tests/run-node-app.sh",
    "test:harness:transcription": "./tests/run-transcription-app.sh"
  }
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add test harness npm scripts"
```

---

## Task 16: Create Test Harness README

**Files:**
- Create: `tests/README.md`

**Step 1: Write comprehensive README**

Create `tests/README.md`:

```markdown
# Test Harness for Deepgram Starter Apps

Comprehensive test suite for validating Deepgram starter applications against their contracts.

## Overview

This test harness validates:
- **NODE requirements**: `.npmrc` security settings, project structure
- **TRANSCRIPTION requirements**: deepgram.toml/Makefile contracts, frontend submodule, API conformance, UI workflows

## Prerequisites

1. **Starter app must be running** at BASE_URL
2. **Dependencies installed** in starter-contracts:
   ```bash
   cd starter-contracts
   pnpm install
   pnpm exec playwright install chromium
   ```

## Usage

### Testing Node Apps

```bash
# From your starter app directory
cd ~/node-transcription
make install && make start

# Run Node tests
~/starter-contracts/tests/run-node-app.sh http://localhost:8080
```

### Testing Transcription Apps

```bash
# From your starter app directory
cd ~/node-transcription
make install && make start

# Run Transcription tests
~/starter-contracts/tests/run-transcription-app.sh http://localhost:8080
```

### Testing node-transcription (Full Coverage)

```bash
cd ~/node-transcription
make install && make start

# Run both test suites
~/starter-contracts/tests/run-node-app.sh http://localhost:8080
~/starter-contracts/tests/run-transcription-app.sh http://localhost:8080
```

## What Gets Tested

### Node Tests

✅ `.npmrc` contains required security settings
✅ `package.json` exists and is valid JSON
✅ `pnpm-lock.yaml` exists (enforces pnpm)
✅ `node_modules/` exists (dependencies installed)

### Transcription Structure Tests

✅ `deepgram.toml` exists and is valid TOML
✅ `[meta]` section exists
✅ All lifecycle sections exist with `command` property
✅ `Makefile` has required targets: check, install, start, update, clean, test
✅ Makefile commands match deepgram.toml lifecycle commands (strict)
✅ `frontend/` directory exists
✅ Frontend is a git submodule
✅ Frontend submodule is initialized

### Transcription API Tests

✅ `/api/metadata` returns 200 OK
✅ Metadata matches deepgram.toml `[meta]` section exactly
✅ All STT conformance tests pass (interfaces/stt/conformance)

### Transcription UI Tests

✅ Page loads successfully
✅ Required UI elements exist (#card-spacewalk, #transcribeBtn)
✅ Full transcription workflow completes
✅ Transcript fuzzy matches expected result (≥85% similarity)

## Test Organization

```
tests/
├── node/                          # Node-specific validations
│   ├── validate-npmrc.sh
│   ├── validate-structure.sh
│   └── shared/
│       └── npmrc-rules.txt
├── transcription/                 # Transcription app tests
│   ├── structure/
│   │   ├── validate-contracts.sh
│   │   └── validate-frontend.sh
│   ├── api/
│   │   ├── metadata.test.js
│   │   └── transcribe.test.js
│   └── ui/
│       └── workflow.spec.js
├── shared/                        # Common utilities
│   ├── toml-parser.sh
│   ├── makefile-parser.sh
│   └── test-helpers.js
├── run-node-app.sh                # Node orchestrator
└── run-transcription-app.sh       # Transcription orchestrator
```

## Environment Variables

- `BASE_URL` (required): The running app URL
- `REPO_PATH` (optional): Path to repo being tested (defaults to `$PWD`)

## Running Individual Tests

### Bash Tests

```bash
# Validate .npmrc
./tests/node/validate-npmrc.sh ~/node-transcription

# Validate Node structure
./tests/node/validate-structure.sh ~/node-transcription

# Validate contracts
./tests/transcription/structure/validate-contracts.sh ~/node-transcription

# Validate frontend
./tests/transcription/structure/validate-frontend.sh ~/node-transcription
```

### Vitest Tests

```bash
cd starter-contracts
BASE_URL=http://localhost:8080 REPO_PATH=~/node-transcription pnpm vitest run tests/transcription/api/
```

### Playwright Tests

```bash
cd starter-contracts
BASE_URL=http://localhost:8080 pnpm playwright test tests/transcription/ui/
```

## Failure Handling

Tests **fail fast**: first failure stops execution with clear error message.

## Extending the Harness

### Adding New Node Validations

Add scripts to `tests/node/` and update `tests/run-node-app.sh`

### Adding New Transcription Tests

Add tests to appropriate directories and update `tests/run-transcription-app.sh`

### Supporting New Starter Types

Create new directories (e.g., `tests/tts/`, `tests/live-transcription/`) and orchestrator scripts.

## Coverage Matrix

| Starter App | Node Tests | Transcription Tests | Full Coverage |
|-------------|-----------|-------------------|---------------|
| node-transcription | ✅ | ✅ | ✅ |
| node-live-transcription | ✅ | ❌ | Partial |
| python-transcription | ❌ | ✅ | Partial |

## Troubleshooting

**Tests fail with "connection refused"**
- Ensure app is running at BASE_URL
- Check app logs for startup errors

**Frontend validation fails**
- Run `git submodule update --init --recursive`
- Verify `.gitmodules` configuration

**UI tests timeout**
- Check if app is actually transcribing (check logs)
- Verify DEEPGRAM_API_KEY is set in app
- Increase timeout in workflow.spec.js if needed

**Fuzzy match fails**
- Check actual transcript in test output
- Verify correct audio file is being used
- Adjust SIMILARITY_THRESHOLD if model changed
```

**Step 2: Commit**

```bash
git add tests/README.md
git commit -m "docs(tests): add comprehensive test harness README"
```

---

## Task 17: Update Main README

**Files:**
- Modify: `README.md`

**Step 1: Add test harness section to main README**

In `README.md`, add after "Testing Starter Apps" section:

```markdown
## Testing Starter Apps

### Overview

This repository includes comprehensive conformance tests for validating that your starter applications correctly implement Deepgram API interfaces. Tests ensure your apps work consistently across the ecosystem.

### Test Harness for Complete Validation

The test harness (`tests/`) provides comprehensive validation beyond API conformance:

- **Node Requirements**: `.npmrc` security, project structure
- **Transcription Requirements**: deepgram.toml/Makefile contracts, frontend setup, API conformance, UI workflows

**Quick Start:**

```bash
# 1. Start your app
cd ~/node-transcription
make install && make start

# 2. Run test suites
~/starter-contracts/tests/run-node-app.sh http://localhost:8080
~/starter-contracts/tests/run-transcription-app.sh http://localhost:8080
```

See [tests/README.md](./tests/README.md) for complete documentation.

### Available Test Suites
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add test harness section to main README"
```

---

## Task 18: Final Integration Test

**Files:**
- None (testing only)

**Step 1: Verify all test scripts are executable**

Run:
```bash
find tests -name "*.sh" -exec ls -la {} \;
```

Expected: All `.sh` files have execute permissions

**Step 2: Verify directory structure**

Run:
```bash
tree tests/ -L 3
```

Expected: Structure matches design

**Step 3: Verify npm scripts work**

Run:
```bash
cat package.json | jq '.scripts'
```

Expected: All test harness scripts present

**Step 4: Quick syntax check on bash scripts**

Run:
```bash
for script in tests/**/*.sh; do
  bash -n "$script" && echo "✅ $script" || echo "❌ $script"
done
```

Expected: All scripts pass syntax check

**Step 5: Document completion**

This task completes the implementation. No commit needed - verification only.

---

## Post-Implementation

### Testing Against Real Starter

To validate the test harness works:

1. Clone a starter app (e.g., node-transcription)
2. Start it locally
3. Run both orchestrator scripts
4. Verify all tests pass or fail appropriately

### Next Steps

- Test against node-transcription starter
- Iterate based on real-world usage
- Extend for live-transcription, tts, etc.
- Add more Node validations as patterns emerge

---

## Summary

This implementation creates a comprehensive test harness with:

- ✅ Bash structure validations (Node, Transcription contracts)
- ✅ Vitest API conformance tests (metadata exact match, STT reuse)
- ✅ Playwright UI workflow tests (fuzzy transcript matching)
- ✅ Shared utilities (TOML/Makefile parsers, JS helpers)
- ✅ Orchestrator scripts (fail-fast, clear output)
- ✅ Complete documentation (usage, troubleshooting, extension)

Total: 18 tasks, each with clear steps, commands, and commit messages.
