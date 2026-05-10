# Test Harness for Deepgram Starter Apps

This test harness provides automated contract testing for Deepgram starter applications. It validates that starter apps correctly implement core Deepgram SDK features and behaviors.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Test Suites](#test-suites)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Adding New Tests](#adding-new-tests)
- [CI/CD Integration](#cicd-integration)

## Overview

The test harness validates starter app behavior by:

1. **Contract Testing**: Verifying SDK method calls match expected signatures
2. **Feature Validation**: Ensuring core features are properly implemented
3. **Error Handling**: Testing error scenarios and edge cases
4. **Integration Testing**: Validating end-to-end workflows

Supported platforms:
- Node.js
- Python
- Browser (JavaScript)

## Prerequisites

### General Requirements
- Git
- Docker (for containerized testing)
- Valid Deepgram API key

### Platform-Specific Requirements

**Node.js:**
- Node.js 18.x or higher
- npm 8.x or higher

**Python:**
- Python 3.8 or higher
- pip

**Browser:**
- Modern browser with JavaScript enabled
- Web server (Python's http.server or Node's http-server)

## Quick Start

### 1. Set Up Environment

```bash
# Copy environment template
cp tests/.env.example tests/.env

# Edit with your API key
echo "DEEPGRAM_API_KEY=your_api_key_here" >> tests/.env
```

### 2. Run Tests for a Starter App

```bash
# Test a Node.js starter app
npm run test:harness /path/to/starter-app node

# Test a Python starter app
npm run test:harness /path/to/starter-app python

# Test a Browser starter app
npm run test:harness /path/to/starter-app browser
```

### 3. Run Specific Test Suites

```bash
# Run only Speech-to-Text tests
cd /path/to/starter-app
/path/to/tests/node/run-tests.sh --suite stt

# Run only Text-to-Speech tests
/path/to/tests/node/run-tests.sh --suite tts

# Run only error handling tests
/path/to/tests/node/run-tests.sh --suite errors
```

## Directory Structure

```
tests/
├── README.md                   # This file
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore patterns
├── run-harness.sh            # Main test harness entry point
├── node/                     # Node.js test suite
│   ├── run-tests.sh          # Node test runner
│   ├── setup.sh              # Node environment setup
│   ├── shared/               # Shared utilities
│   │   ├── utils.sh          # Common utilities
│   │   ├── logger.sh         # Logging functions
│   │   └── validators.sh     # Validation functions
│   └── tests/                # Test files
│       ├── stt/              # Speech-to-Text tests
│       ├── tts/              # Text-to-Speech tests
│       ├── live/             # Live transcription tests
│       └── errors/           # Error handling tests
├── python/                   # Python test suite
│   ├── run-tests.sh          # Python test runner
│   ├── setup.sh              # Python environment setup
│   ├── shared/               # Shared utilities
│   └── tests/                # Test files
└── browser/                  # Browser test suite
    ├── run-tests.sh          # Browser test runner
    ├── setup.sh              # Browser environment setup
    ├── shared/               # Shared utilities
    └── tests/                # Test files
```

## Test Suites

### Speech-to-Text (STT) Tests

**Location**: `tests/{platform}/tests/stt/`

Tests prerecorded audio transcription:
- ✅ Basic transcription
- ✅ URL-based transcription
- ✅ Model selection (nova-2, whisper, etc.)
- ✅ Feature flags (punctuation, diarization, etc.)
- ✅ Multiple audio formats (WAV, MP3, FLAC, etc.)

### Text-to-Speech (TTS) Tests

**Location**: `tests/{platform}/tests/tts/`

Tests audio synthesis:
- ✅ Basic synthesis
- ✅ Voice selection (aura-asteria-en, etc.)
- ✅ Format selection (MP3, WAV, etc.)
- ✅ Encoding options (linear16, mulaw, etc.)
- ✅ Long-form text synthesis

### Live Transcription Tests

**Location**: `tests/{platform}/tests/live/`

Tests real-time transcription:
- ✅ WebSocket connection
- ✅ Streaming audio data
- ✅ Interim results
- ✅ Final transcripts
- ✅ Connection lifecycle
- ✅ Control messages (KeepAlive, ClearBuffer, etc.)

### Error Handling Tests

**Location**: `tests/{platform}/tests/errors/`

Tests error scenarios:
- ✅ Invalid API keys
- ✅ Malformed requests
- ✅ Network failures
- ✅ Rate limiting
- ✅ Invalid audio formats
- ✅ Timeout handling

## Usage

### Running the Full Test Harness

```bash
# Basic usage
npm run test:harness <starter-app-path> <platform>

# With verbose output
npm run test:harness <starter-app-path> <platform> --verbose

# With specific test suite
npm run test:harness <starter-app-path> <platform> --suite stt

# Skip environment setup
npm run test:harness <starter-app-path> <platform> --no-setup
```

### Running Platform-Specific Tests

**Node.js:**
```bash
cd /path/to/starter-app
/path/to/tests/node/run-tests.sh

# With options
/path/to/tests/node/run-tests.sh --suite stt --verbose
```

**Python:**
```bash
cd /path/to/starter-app
/path/to/tests/python/run-tests.sh

# With options
/path/to/tests/python/run-tests.sh --suite tts --verbose
```

**Browser:**
```bash
cd /path/to/starter-app
/path/to/tests/browser/run-tests.sh

# With options
/path/to/tests/browser/run-tests.sh --suite live --verbose
```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--suite <name>` | Run specific test suite (stt, tts, live, errors) | all |
| `--verbose` | Enable verbose output | false |
| `--no-setup` | Skip environment setup | false |
| `--keep-alive` | Keep server running after tests | false |
| `--port <number>` | Specify server port | 3000 |
| `--help` | Show help message | - |

## Environment Variables

Create a `tests/.env` file with the following variables:

```bash
# Required
DEEPGRAM_API_KEY=your_api_key_here

# Optional
DEEPGRAM_API_URL=https://api.deepgram.com
LOG_LEVEL=info           # debug, info, warn, error
TEST_TIMEOUT=30000       # Test timeout in milliseconds
RETRY_ATTEMPTS=3         # Number of retry attempts for flaky tests
RETRY_DELAY=1000        # Delay between retries in milliseconds

# Audio files for testing
AUDIO_FILE_URL=https://dpgr.am/spacewalk.wav
AUDIO_FILE_PATH=./audio/test.wav

# Server configuration
SERVER_PORT=3000
SERVER_HOST=localhost
```

## Troubleshooting

### Common Issues

#### Tests Fail with "Command not found"

**Problem**: Shell scripts can't find required commands (node, python, npm, etc.)

**Solution**:
```bash
# Make sure scripts are executable
chmod +x tests/**/*.sh

# Verify PATH includes necessary tools
which node
which python3
which npm
```

#### API Key Issues

**Problem**: Tests fail with authentication errors

**Solution**:
```bash
# Verify API key is set
cat tests/.env | grep DEEPGRAM_API_KEY

# Test API key manually
curl https://api.deepgram.com/v1/listen \
  -H "Authorization: Token YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://dpgr.am/spacewalk.wav"}'
```

#### Port Already in Use

**Problem**: Server fails to start because port is already in use

**Solution**:
```bash
# Find process using the port
lsof -i :3000

# Kill the process or use a different port
/path/to/tests/node/run-tests.sh --port 3001
```

#### Tests Hang Indefinitely

**Problem**: Tests don't complete and hang

**Solution**:
```bash
# Increase timeout
export TEST_TIMEOUT=60000

# Run with verbose logging to see where it hangs
/path/to/tests/node/run-tests.sh --verbose

# Check for unclosed connections
netstat -an | grep ESTABLISHED
```

#### Audio File Not Found

**Problem**: Tests fail to load audio files

**Solution**:
```bash
# Verify audio file exists
ls -la audio/

# Use URL instead of local file
export AUDIO_FILE_URL=https://dpgr.am/spacewalk.wav

# Download audio file
mkdir -p audio
curl -o audio/test.wav https://dpgr.am/spacewalk.wav
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set log level to debug
export LOG_LEVEL=debug

# Run tests with verbose output
/path/to/tests/node/run-tests.sh --verbose

# View full test output
/path/to/tests/node/run-tests.sh --verbose 2>&1 | tee test-output.log
```

### Getting Help

If you encounter issues not covered here:

1. Check the [main README](../README.md) for general setup instructions
2. Review the [Deepgram documentation](https://developers.deepgram.com/)
3. Open an issue on GitHub with:
   - Test harness version
   - Platform (Node.js/Python/Browser)
   - Full error output
   - Steps to reproduce

## Adding New Tests

### 1. Create Test File

```bash
# Create test file in appropriate directory
touch tests/node/tests/stt/my-new-test.js
```

### 2. Implement Test

```javascript
// tests/node/tests/stt/my-new-test.js
const { createClient } = require("@deepgram/sdk");

async function testMyNewFeature() {
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl({
      url: "https://dpgr.am/spacewalk.wav"
    }, {
      model: "nova-2",
      smart_format: true
    });

    if (error) {
      console.error("❌ Test failed:", error);
      return false;
    }

    // Add assertions
    if (!result.results.channels[0].alternatives[0].transcript) {
      console.error("❌ No transcript returned");
      return false;
    }

    console.log("✅ Test passed");
    return true;
  } catch (err) {
    console.error("❌ Test error:", err);
    return false;
  }
}

module.exports = { testMyNewFeature };
```

### 3. Register Test

Add to test suite runner:

```bash
# tests/node/tests/stt/run-stt-tests.sh
source "${TEST_DIR}/my-new-test.js"
run_test "My New Feature" testMyNewFeature
```

### 4. Run Test

```bash
cd /path/to/starter-app
/path/to/tests/node/run-tests.sh --suite stt
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Starter App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        platform: [node, python, browser]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run Test Harness
        env:
          DEEPGRAM_API_KEY: ${{ secrets.DEEPGRAM_API_KEY }}
        run: |
          npm run test:harness . ${{ matrix.platform }}
```

### GitLab CI

```yaml
test:starter-app:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run test:harness . node
  variables:
    DEEPGRAM_API_KEY: $DEEPGRAM_API_KEY
```

### Jenkins

```groovy
pipeline {
  agent any

  environment {
    DEEPGRAM_API_KEY = credentials('deepgram-api-key')
  }

  stages {
    stage('Test') {
      steps {
        sh 'npm ci'
        sh 'npm run test:harness . node'
      }
    }
  }
}
```

## Best Practices

### Test Organization
- Keep tests focused and single-purpose
- Use descriptive test names
- Group related tests in suites
- Avoid test interdependencies

### Test Data
- Use consistent test audio files
- Include various audio formats
- Test with different text lengths
- Use both valid and invalid inputs

### Error Handling
- Test both success and failure paths
- Verify error messages are helpful
- Test network failure scenarios
- Validate timeout handling

### Maintenance
- Keep tests up to date with SDK changes
- Document test requirements
- Review and update regularly
- Remove obsolete tests

## License

This test harness is part of the Deepgram starter apps project and follows the same license terms.
