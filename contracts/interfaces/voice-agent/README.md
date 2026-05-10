# Voice Agent Interface Contract

Minimal Voice Agent scaffolding for Deepgram starter applications. Connect via WebSocket for conversational AI with speech-to-text, LLM processing, and text-to-speech.

**Purpose:** This contract provides the bare minimum structure for internal developers to quickly build Voice Agent starter apps. It's scaffolding, not a production-ready demo.

## Transport

WebSocket

## Endpoint

```
wss://{host}:{port}/api/voice-agent
```

## Query Parameters

See [query.json](./schema/query.json).

## Request Body

See [request.json](./schema/request.json).

## Responses

### WebSocket Messages

See [response.json](./schema/response.json)

### Errors

See [error.json](./schema/error.json)

### Warnings

See [warning.json](./schema/warning.json)

## Conformance Requirements & Testing

Starter applications implementing this interface at a minimum should pass the [conformance tests](./conformance/converse.spec.js). These conformance tests validate that your minimal starter app correctly implements the Voice Agent pass-through proxy, forwarding messages between the browser and Deepgram's Agent API.

### Prerequisites

1. **Your starter app must be running** and accessible via WebSocket
2. **Implement the `/api/voice-agent` WebSocket endpoint** according to this specification in your Starter App.
3. **Install dependencies** in this contracts repo:

   ```bash
   cd starter-contracts
   pnpm install
   ```

### Running Conformance Tests

#### Against Your Local Development Server

```bash
# Start your starter app (example - your commands will vary)
cd my-voice-agent-starter
pnpm start  # Runs on ws://localhost:8081

# In another terminal, run conformance tests
cd starter-contracts
WS_URL=ws://localhost:8081 pnpm run test:voice-agent
```

#### Against Your Deployed Starter App

```bash
# Test your deployed app
WS_URL=wss://my-voice-agent-app.example.com pnpm run test:voice-agent
```
