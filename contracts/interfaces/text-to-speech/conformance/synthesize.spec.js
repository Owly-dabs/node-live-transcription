import { describe, it, expect } from "vitest";
import { BASE_URL, authHeaders } from "./util.js";

const ENDPOINT = process.env.TEXT_TO_SPEECH_ENDPOINT || "/api/text-to-speech";
const SAMPLE_TEXT = "Hello, this is a test of the Deepgram text to speech.";

describe("Text-to-Speech Interface Conformance:", () => {

  it("should synthesize text to audio", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    const contentType = response.headers.get("Content-Type");
    expect(contentType).toMatch(/audio\/|application\/octet-stream/);

    const audioBuffer = await response.arrayBuffer();
    expect(audioBuffer.byteLength).toBeGreaterThan(0);
  });

  it("should accept model parameter", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?model=aura-2-apollo-en`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    const audioBuffer = await response.arrayBuffer();
    expect(audioBuffer.byteLength).toBeGreaterThan(0);
  });

  it("should return error for empty text", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: "" })
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.code).toBeDefined();
    expect(result.error.message).toBeDefined();
  });

  it("should handle invalid query parameters gracefully", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?invalid_param=value`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    // Should either ignore unknown param or return 400
    expect([200, 400]).toContain(response.status);
  });

  it("should handle very long text gracefully", async () => {
    const longText = "This is a test sentence. ".repeat(1000); // ~25KB of text

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: longText })
    });

    // Should either process it or return error, but not crash
    expect([200, 400, 413]).toContain(response.status);

    if (response.status === 200) {
      const audioBuffer = await response.arrayBuffer();
      expect(audioBuffer.byteLength).toBeGreaterThan(0);
    } else {
      const result = await response.json();
      expect(result.error).toBeDefined();
    }
  });

});

