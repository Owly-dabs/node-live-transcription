import { getTestSessionToken, getWsProtocols } from "../../../tests/shared/test-helpers.js";

// Base WebSocket URL for Flux conformance tests
export const WS_URL = process.env.WS_URL || "ws://localhost:3000";

// HTTP base URL for fetching session tokens (derived from WS_URL)
export const HTTP_BASE_URL = process.env.BASE_URL || WS_URL.replace(/^ws/, "http");

export { getTestSessionToken, getWsProtocols };
