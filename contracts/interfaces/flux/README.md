# Flux Interface Contract

Minimal Flux WebSocket proxy scaffolding for Deepgram starter applications. Send binary audio data, get real-time transcripts via WebSocket.

**Purpose:** This contract provides the bare minimum structure for internal developers to quickly build Flux starter apps. It's scaffolding, not a production-ready demo.

## Transport

WebSocket

## Endpoint

```
wss://{host}:{port}/api/flux
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

Starter applications implementing this interface at a minimum should pass the [conformance tests](./conformance/stream.spec.js). These conformance tests validate that your minimal starter app correctly implements the Flux scaffolding contract.

### Prerequisites

1. **Your starter app must be running** and accessible via WebSocket
2. **Implement the WebSocket endpoint** according to this specification in your Starter App.
3. **Install dependencies** in this contracts repo:

   ```bash
   cd starter-contracts
   pnpm install
   ```

### Running Conformance Tests

#### Against Your Local Development Server

```bash
# Start your starter app (example - your commands will vary)
cd my-flux-starter
pnpm start  # Runs on ws://localhost:8081

# In another terminal, run conformance tests
cd starter-contracts
WS_URL=ws://localhost:8081 pnpm run test:flux
```

#### Against Your Deployed Starter App

```bash
# Test your deployed app
WS_URL=wss://my-flux-app.vercel.app pnpm run test:flux
```
