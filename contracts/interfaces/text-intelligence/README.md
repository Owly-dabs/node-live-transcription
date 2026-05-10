# Text Intelligence Interface Contract

Minimal Text Intelligence scaffolding for Deepgram starter applications. Send text, get intelligence insights.

**Purpose:** This contract provides the bare minimum structure for internal developers to quickly build Text Intelligence starter apps. It's scaffolding, not a production-ready demo.

## Transport

HTTP REST API

## Endpoint

```http
POST /text-intelligence/analyze
```

## Query Parameters

See [query.json](./schema/query.json).

**Minimal parameters:**
- `language` - Language code (en only. defaults to 'en')
- `summarize` - Enable summarization (minimal parameter required for successful request)

## Request Body

See [request.json](./schema/request.json).

## Responses

### 200 OK

See [response.json](./schema/response.json)

### 4XX Errors

See [error.json](./schema/error.json)

## Conformance Requirements & Testing

Starter applications implementing this interface at a minimum should pass the [conformance tests](./conformance/analyze.spec.js). These conformance tests validate that your minimal starter app correctly implements the Text Intelligence scaffolding contract.

### Prerequisites

1. **Your starter app must be running** and accessible via HTTP
2. **Implement the `/text-intelligence/analyze` endpoint** according to this specification in your Starter App.
3. **Install dependencies** in this contracts repo:

   ```bash
   cd starter-contracts
   pnpm install
   ```

### Running Conformance Tests

#### Against Your Local Development Server

```bash
# Start your starter app (example - your commands will vary)
cd my-text-intelligence-starter
pnpm start  # Runs on http://localhost:3000

# In another terminal, run conformance tests
cd starter-contracts
BASE_URL=http://localhost:3000 pnpm run test:text-intelligence
```

#### Against Your Deployed Starter App

```bash
# Test your deployed app[
BASE_URL=https://my-text-intelligence-app.vercel.app pnpm run test:text-intelligence
```
