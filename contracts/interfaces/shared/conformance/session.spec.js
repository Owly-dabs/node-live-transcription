import { describe, it, expect } from "vitest";

/**
 * Session Auth Conformance Tests
 *
 * Tests that the backend implements the session auth contract:
 * - GET /api/session returns a valid JWT token
 * - Protected endpoints return 401 without Authorization header
 * - Protected endpoints return 401 with invalid token
 *
 * These tests run in dev mode (no SESSION_SECRET), so /api/session
 * issues tokens freely without nonce validation.
 */

// Base URL from environment (set by test runner)
const BASE_URL = process.env.BASE_URL || "http://localhost:8081";

describe("Session Auth Conformance:", () => {

  it("should return a JWT from GET /api/session", async () => {
    const response = await fetch(`${BASE_URL}/api/session`);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/application\/json/);

    const data = await response.json();
    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe("string");

    // JWT has 3 dot-separated parts
    const parts = data.token.split(".");
    expect(parts.length).toBe(3);
  });

  it("should return 401 for protected REST endpoint without token", async () => {
    // Use the first available REST endpoint for testing
    // Transcription uses multipart, TTS uses JSON, Text Intelligence uses JSON
    const endpoint = process.env.TRANSCRIPTION_ENDPOINT
      || process.env.TEXT_TO_SPEECH_ENDPOINT
      || process.env.TEXT_INTEL_ENDPOINT
      || null;

    if (!endpoint) {
      // Skip if no REST endpoint is configured (WebSocket-only demo)
      console.log("No REST endpoint configured, skipping REST 401 test");
      return;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "test" }),
    });

    expect(response.status).toBe(401);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.type).toBe("AuthenticationError");
    expect(result.error.code).toBe("MISSING_TOKEN");
  });

  it("should return 401 for protected REST endpoint with invalid token", async () => {
    const endpoint = process.env.TRANSCRIPTION_ENDPOINT
      || process.env.TEXT_TO_SPEECH_ENDPOINT
      || process.env.TEXT_INTEL_ENDPOINT
      || null;

    if (!endpoint) {
      console.log("No REST endpoint configured, skipping REST invalid token test");
      return;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid.token.here",
      },
      body: JSON.stringify({ text: "test" }),
    });

    expect(response.status).toBe(401);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.type).toBe("AuthenticationError");
    expect(result.error.code).toBe("INVALID_TOKEN");
  });

});
