# Text-to-Speech Interface Contract

Minimal text-to-speech scaffolding for Deepgram starter applications. Send text, get audio.

**Purpose:** This contract provides the bare minimum structure for internal developers to quickly build text-to-speech starter apps. It's scaffolding, not a production-ready demo.

## Transport

HTTP REST API

## Endpoint

```http
POST /api/text-to-speech
```

## Query Parameters

See [query.json](./schema/query.json).

## Request Body

See [request.json](./schema/request.json).

## Responses

### 200 OK

Binary audio data (`application/octet-stream`)

### 4XX Errors

See [error.json](./schema/error.json)

## Conformance Requirements & Testing

Starter applications implementing this interface at a minimum should pass the [conformance tests](./conformance/synthesize.spec.js). These conformance tests validate that your minimal starter app correctly implements the text-to-speech scaffolding contract.

### Prerequisites

1. **Your starter app must be running** and accessible via HTTP
2. **Implement the `/api/text-to-speech` endpoint** according to this specification in your Starter App.
3. **Install dependencies** in this contracts repo:

   ```bash
   cd starter-contracts
   pnpm install
   ```

### Running Conformance Tests

#### Against Your Local Development Server

```bash
# Start your starter app (example - your commands will vary)
cd my-text-to-speech-starter
pnpm start  # Runs on http://localhost:8081

# In another terminal, run conformance tests
cd starter-contracts
BASE_URL=http://localhost:8081 pnpm run test:text-to-speech
```

#### Against Your Deployed Starter App

```bash
# Test your deployed app
BASE_URL=https://my-text-to-speech-app.vercel.app pnpm run test:text-to-speech
```

