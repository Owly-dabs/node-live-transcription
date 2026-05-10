# Live Transcription Interface Contract

Minimal live transcription scaffolding for Deepgram starter applications. Stream live audio, get real-time transcripts.

**Purpose:** This contract provides the bare minimum structure for internal developers to quickly build live transcription starter apps. It's scaffolding, not a production-ready demo.

## Transport

WebSocket

## Endpoint

```
wss://{host}:{port}/api/live-transcription?stream_url=STREAM_URL
```
## Query Parameters

See [query.json](./schema/query.json).

## Request Body

See [request.json](./schema/request.json).

## Responses

### 200 OK

See [response.json](./schema/response.json)

### 4XX Errors

See [error.json](./schema/error.json)

## Conformance Requirements & Testing

Starter applications implementing this interface at a minimum should pass the [conformance tests](./conformance/stream.spec.js). These conformance tests validate that your minimal starter app correctly implements the live transcription scaffolding contract.

### Prerequisites

1. **Your starter app must be running** and accessible via WebSocket
2. **Implement the WebSocket endpoint** according to this specification in your Starter App.
3. **Install dependencies** in this contracts repo:

   ```bash
   cd starter-contracts
   npm install
   ```

### Running Conformance Tests

#### Against Your Local Development Server

```bash
# Start your starter app (example - your commands will vary)
cd my-live-transcription-starter
pnpm start  # Runs on ws://localhost:8081

# In another terminal, run conformance tests
cd starter-contracts
WS_URL=ws://localhost:8081 pnpm run test:live-transcription
```

#### Against Your Deployed Starter App

```bash
# Test your deployed app
WS_URL=wss://my-live-transcription-app.vercel.app pnpm run test:live-transcription
```