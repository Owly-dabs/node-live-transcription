# Test Harness Design for Deepgram Starter Apps

**Date:** 2026-02-02
**Status:** Approved
**Scope:** NODE and TRANSCRIPTION requirements

## Overview

A comprehensive test harness to validate Deepgram starter applications against their contracts. The harness validates repository structure, configuration files, API contracts, and UI workflows using the best tool for each test type.

## Goals

- Validate NODE-specific requirements (`.npmrc`, project structure)
- Validate TRANSCRIPTION-specific requirements (deepgram.toml, Makefile, frontend, API, UI)
- Point at any running starter app and verify compliance
- Fail fast with actionable feedback
- Extensible for future starter types

## Approach

### Test Organization

Tests organized by concern in `tests/` directory:

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
├── run-node-app.sh                # Node test orchestrator
└── run-transcription-app.sh       # Transcription test orchestrator
```

### Test Execution Model

**Assumptions:**
- Starter app is already running at BASE_URL
- Tests run from app directory (`$PWD` is the app being tested)
- Test harness accessed via relative path

**Failure Handling:**
- Fail fast: stop on first test failure
- Clear error messages for immediate action

**Example Usage:**
```bash
cd ~/node-transcription
make install && make start

# Run tests
~/starter-contracts/tests/run-node-app.sh http://localhost:8080
~/starter-contracts/tests/run-transcription-app.sh http://localhost:8080
```

## Test Suites

### 1. Node Test Suite

**Purpose:** Validate Node-specific requirements

**Tests:**
- `validate-npmrc.sh`: Check `.npmrc` contains required security settings
- `validate-structure.sh`: Verify Node project structure (package.json, pnpm-lock.yaml, node_modules)

**Required .npmrc Settings:**
```ini
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

**Framework:** Bash (no dependencies)

**Extensibility:** Additional Node validations added as patterns emerge

### 2. Transcription Structure Tests

**Purpose:** Validate repository contracts

**Tests:**

**validate-contracts.sh:**
1. Check `deepgram.toml` exists and is valid TOML
2. Validate `[meta]` section exists with required fields
3. Validate lifecycle sections exist with `command` property:
   - `[lifecycle.check]`
   - `[lifecycle.install]`
   - `[lifecycle.start]`
   - `[lifecycle.update]`
   - `[lifecycle.clean]`
   - `[lifecycle.test]`
4. Parse Makefile and validate targets exist: `check`, `install`, `start`, `update`, `clean`, `test`
5. **Strict validation:** Verify Makefile target commands match deepgram.toml lifecycle commands

**validate-frontend.sh:**
1. Check `frontend/` directory exists
2. Verify it's a git submodule (check `.gitmodules`)
3. Verify submodule is initialized (not empty, has `.git`)

**Framework:** Bash with shared TOML/Makefile parsers

### 3. Transcription API Tests

**Purpose:** Validate backend API contracts

**Tests:**

**metadata.test.js:**
- GET `/api/metadata`
- Parse `deepgram.toml` `[meta]` section
- **Exact match validation:** Every field from TOML must match API response
- Fails if any field missing or mismatched

**transcribe.test.js:**
- Reuses existing conformance tests from `interfaces/stt/conformance/transcribe.spec.js`
- No duplication: imports and runs in test suite context

**Framework:** Vitest (already installed)

**Test Data:** Remote URLs (`https://dpgr.am/spacewalk.wav`)

### 4. Transcription UI Tests

**Purpose:** Validate frontend workflow end-to-end

**Tests:**

**workflow.spec.js:**
1. Navigate to BASE_URL
2. Select audio source via `#card-spacewalk` (Stanford debate audio)
3. Click transcribe button `#transcribeBtn`
4. Wait for results (30s timeout for API call)
5. **Fuzzy match transcript:** Compare result with expected transcript using string similarity
6. Pass if similarity ≥ 85%

**Element IDs:** Consistent across all `*-transcription` frontends (transcription-html, future transcription-react)

**Expected Transcript (Stanford debate):**
```
so the logic behind this article he said please pirate my cut my songs
because if everybody knows my songs and everybody comes to my concerts
i'll make much more money than if everybody buys my records...
```

**Framework:** Playwright + string-similarity library

**Fuzzy Matching Rationale:**
- Transcription results vary by model, timing, API version
- 85% similarity threshold catches real failures while tolerating minor variations
- Normalizes whitespace before comparison

## Orchestrator Scripts

Each orchestrator script runs all tests for its concern:

```bash
#!/bin/bash
# Usage: ./tests/run-transcription-app.sh <BASE_URL> [REPO_PATH]

set -e  # Exit on first failure

BASE_URL=$1
REPO_PATH=${2:-$PWD}  # Default to current directory

[[ -z "$BASE_URL" ]] && echo "Usage: $0 <BASE_URL> [REPO_PATH]" && exit 1

echo "🔍 Testing transcription app at: $BASE_URL"
echo "📁 Validating repo: $REPO_PATH"

# Run tests in order: structure → API → UI
echo "🔍 Validating repository structure..."
bash tests/transcription/structure/validate-contracts.sh "$REPO_PATH"
bash tests/transcription/structure/validate-frontend.sh "$REPO_PATH"

echo "🧪 Running API conformance tests..."
BASE_URL=$BASE_URL pnpm vitest run tests/transcription/api/

echo "🎭 Running UI workflow tests..."
BASE_URL=$BASE_URL pnpm playwright test tests/transcription/ui/

echo "✅ All transcription tests passed!"
```

## Shared Utilities

### toml-parser.sh
- `parse_toml_meta()`: Extract `[meta]` section as key=value pairs
- `parse_toml_lifecycle()`: Extract specific lifecycle command

### makefile-parser.sh
- `list_makefile_targets()`: List all Makefile targets
- `get_makefile_command()`: Get command for specific target

### test-helpers.js
- `parseToml()`: Simple TOML parser for JavaScript tests
- Exports `BASE_URL`, `REPO_PATH` environment variables

## Dependencies

**New dependencies to add:**
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "string-similarity": "^4.0.4"
  }
}
```

**Existing (already installed):**
- vitest: 3.2.4
- ws: 8.18.0

## Environment Variables

- `BASE_URL` (required): Running app URL (e.g., `http://localhost:8080`)
- `REPO_PATH` (optional): Path to repo for structure validation (defaults to `$PWD`)
- `DEEPGRAM_API_KEY` (required): API key for Deepgram (app needs it to run)

## Coverage Matrix

| Starter App | Node Tests | Transcription Tests | Full Coverage |
|-------------|-----------|-------------------|---------------|
| node-transcription | ✅ | ✅ | ✅ |
| node-live-transcription | ✅ | ❌ | Partial |
| python-transcription | ❌ | ✅ | Partial |
| node-tts | ✅ | ❌ | Partial |

**Initial Focus:** NODE + TRANSCRIPTION fully covers `node-transcription` starter

## Extension Points

### Future Test Types

- `tests/live-transcription/` - WebSocket streaming tests
- `tests/tts/` - Text-to-speech tests
- `tests/python/` - Python-specific validations (venv, requirements.txt)

### Future Orchestrators

- `run-live-transcription-app.sh`
- `run-tts-app.sh`
- `run-python-app.sh`

### Additional Validations

**Node tests:**
- Validate `package.json` engines field
- Check for security vulnerabilities (npm audit)
- Verify lockfile integrity

**Transcription tests:**
- Test error handling (invalid files, network failures)
- Validate README structure
- Check for required documentation

## Success Criteria

A starter app passes the test harness when:
1. ✅ All structure validations pass (files, configuration, contracts)
2. ✅ All API tests pass (metadata exact match, transcription conformance)
3. ✅ All UI tests pass (workflow completes, fuzzy match ≥ 85%)
4. ✅ No test failures (fail fast triggers exit)

## Non-Goals

- **Not bootstrapping apps:** Tests assume app is already running
- **Not testing Makefile execution:** Validates targets exist, doesn't run them
- **Not framework unification:** Use best tool per test type (bash, vitest, playwright)
- **Not offline testing:** Uses remote test fixtures (dpgr.am URLs)

## Implementation Notes

### Parsing Simplicity

Bash parsers (TOML, Makefile) use simple grep/sed patterns sufficient for our structured formats. No need for complex parsing libraries - our files follow predictable patterns.

### Test Data Strategy

Use remote URLs for test fixtures to avoid:
- Committing binary files to repo
- Managing local fixture downloads
- Syncing test data across environments

Remote URLs work anywhere with internet connection.

### Element ID Consistency

All `*-transcription` frontends (current and future) maintain consistent element IDs:
- `#card-spacewalk` - Audio selection cards
- `#transcribeBtn` - Submit button
- This contract enables UI tests to work across all frontend implementations

### Fuzzy Matching Algorithm

Uses Dice's Coefficient (string-similarity library) which:
- Compares bigram similarity
- Range: 0 (no match) to 1 (exact match)
- Threshold: 0.85 (85% similarity)
- Normalizes whitespace before comparison

## Alternatives Considered

### Single Framework vs. Best Tool Per Type
**Decision:** Best tool per type
**Rationale:** "Nuclear powered test harness" approach prioritizes comprehensive coverage over framework consistency. Dependencies are not a concern.

### Bootstrap vs. Assume Running
**Decision:** Assume running
**Rationale:** Simpler tests, no process management, user controls app environment. Matches existing conformance test pattern.

### Exact vs. Fuzzy Transcript Matching
**Decision:** Fuzzy matching with 85% threshold
**Rationale:** Transcription results vary by model/timing. Fuzzy matching catches real failures while tolerating minor variations.

### Execute Makefile Targets vs. Validate Existence
**Decision:** Validate existence only
**Rationale:** App is already running (proves `make start` worked). Validating structure assumes execution works.

## Next Steps

1. ✅ Design approved and documented
2. Create implementation plan
3. Build test harness infrastructure:
   - Orchestrator scripts
   - Bash validation scripts
   - Shared utilities
4. Implement test suites:
   - Node tests
   - Transcription structure tests
   - Transcription API tests
   - Transcription UI tests
5. Test against `node-transcription` starter
6. Document usage and iterate
