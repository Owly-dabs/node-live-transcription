import { getTestSessionToken, authHeaders } from "../../../tests/shared/test-helpers.js";

// Base URL for Text Intelligence conformance tests
export const BASE_URL = process.env.BASE_URL || "http://localhost:8787";

export { getTestSessionToken, authHeaders };
