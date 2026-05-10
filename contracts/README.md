# Deepgram Starter Contracts

A comprehensive collection of API contract specifications for Deepgram's services, providing standardized OpenAPI and AsyncAPI specifications, JSON schemas and conformance tests to help build standardized Deepgram Starter Apps.

## Why Use This Library?

This repository serves as the definitive source for:
- **API Contract Specifications**: OpenAPI and AsyncAPI specs for all Deepgram APIs
- **Schema Definitions**: JSON schemas for request/response validation
- **Conformance Testing**: Automated tests to ensure API compliance
- **Developer Documentation**: Clear guides for each API interface

## Getting Started

### Prerequisites

Before getting started, ensure you have the following installed:

- pnpm for dependency management.
- Node Version 18 or higher

```bash
# Node.js (version 18 or higher recommended)
node --version

# pnpm package manager
pnpm --version

# If pnpm is not installed:
npm install -g pnpm
```

### Quick Start

1. Clone the Repo:

```bash
git@github.com:deepgram/starter-contracts.git

cd starter-apps/starter-contracts
```

2. Install dependencies:

```bash
 pnpm i
 ```

## Repository Structure

```
interfaces/
├── transcription/         # Transcription (REST API)
├── text-to-speech/        # Text-to-Speech (REST API)
├── text-intelligence/     # Text Intelligence services
├── live-transcription/    # Live Transcription (WebSocket)
├── live-text-to-speech/   # Live Text-to-Speech (WebSocket)
├── voice-agent/           # Voice Agent (WebSocket)
└── flux/                  # Flux (WebSocket)
```

Each interface directory contains:
- `asyncapi.yml` or `openapi.yml` - API specification
- `schema/` - JSON schema definitions
- `conformance/` - Conformance tests and documentation
- `README.md` - Interface-specific documentation

## Testing Starter Apps

### Overview

This repository includes comprehensive conformance tests for validating that your starter applications correctly implement Deepgram API interfaces. Tests ensure your apps work consistently across the ecosystem.

### Available Test Suites

These are integration tests that require a running starter application implementing the interface you want to test.

Refer to individual READMEs for detailed setup instructions:

**REST**
- [Transcription](./interfaces/transcription/README.md)
- [Text-to-Speech](./interfaces/text-to-speech/README.md)
- [Text Intelligence](./interfaces/text-intelligence/README.md)

**WebSocket**
- [Live Transcription](./interfaces/live-transcription/README.md)
- [Live Text-to-Speech](./interfaces/live-text-to-speech/README.md)
- [Flux](./interfaces/flux/README.md)
- [Voice Agent](./interfaces/voice-agent/README.md)

## Test Harness for Starter Apps

### Overview

In addition to interface-specific conformance tests, this repository provides a comprehensive test harness for validating complete starter applications. The test harness performs automated contract testing to ensure starter apps correctly implement core Deepgram SDK features.

### Supported Platforms

- **Node.js**: Full SDK feature testing
- **Python**: Full SDK feature testing
- **Browser**: JavaScript SDK testing

### Quick Start

```bash
# Set up environment
cp tests/.env.example tests/.env
# Edit tests/.env with your DEEPGRAM_API_KEY

# Run tests for a starter app
npm run test:harness /path/to/starter-app node
npm run test:harness /path/to/starter-app python
npm run test:harness /path/to/starter-app browser
```

### What the Test Harness Validates

- ✅ **Speech-to-Text**: Prerecorded transcription with various models and features
- ✅ **Text-to-Speech**: Audio synthesis with different voices and formats
- ✅ **Live Transcription**: WebSocket streaming and control messages
- ✅ **Error Handling**: Invalid inputs, network failures, and edge cases
- ✅ **SDK Integration**: Proper use of Deepgram SDK methods and signatures

### Documentation

For detailed information about the test harness, including:
- Setup and configuration
- Running specific test suites
- Troubleshooting common issues
- Adding new tests
- CI/CD integration

See the [Test Harness README](./tests/README.md).

### Adding New Interface Specifications

1. Create a new directory under `interfaces/`
2. Follow the established structure:
3. Add conformance tests
4. Update this main README

### Modifying Existing Specifications

1. Update the relevant specification files
2. Update corresponding schemas and examples
3. Run conformance tests to ensure compatibility
4. Update documentation as needed

## Getting Help

* Report an [issue or bug](https://github.com/deepgram/starter-contracts/issues)

## License

This project is licensed under the [LICENSE](./LICENSE) file in the repository root.
