import { describe, it, expect } from "vitest";
import { BASE_URL, authHeaders } from "./util.js";

const ENDPOINT = process.env.TEXT_INTEL_ENDPOINT || "/api/text-intelligence";
const SAMPLE_TEXT = "This is a sample text for analysis. It contains multiple sentences. We can test the text intelligence features with this content. The system should be able to analyze and summarize this text effectively.";

describe("Text Intelligence Interface Conformance:", () => {

  it("should analyze text with summarize=true", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/application\/json/);

    const result = await response.json();
    expect(result.results).toBeDefined();
    expect(result.results.summary).toBeDefined();
    expect(result.results.summary.text).toBeDefined();
    expect(typeof result.results.summary.text).toBe("string");
    expect(result.results.summary.text.length).toBeGreaterThan(0);
  });

  it("should accept summarize parameter", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.results.summary).toBeDefined();
  });

  it("should return error for empty text", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true`, {
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
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true&invalid_param=value`, {
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

  it("should handle very long text gracefully", { timeout: 15000 }, async () => {
    const longText = "This is a test sentence. ".repeat(1000); // ~25KB of text

    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: longText })
    });

    // Should either process it or return error, but not crash
    // 504 is acceptable when reverse proxy times out on large payloads
    expect([200, 400, 413, 504]).toContain(response.status);

    if (response.status === 200) {
      const result = await response.json();
      expect(result.results.summary).toBeDefined();
    } else {
      const result = await response.json();
      expect(result.error).toBeDefined();
    }
  });

  it("should accept language parameter", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true&language=en`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.results.summary).toBeDefined();
  });

  // URL Support Tests
  it("should analyze text from URL with summarize=true", async () => {
    // Note: This test requires a publicly accessible URL with text content.
    // The node text intelligence starter hosts this public file.
    const testUrl = "https://raw.githubusercontent.com/deepgram-starters/node-text-intelligence/refs/heads/main/sample-text.txt"

    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ url: testUrl })
    });

    // Should either succeed or fail gracefully (URL might not exist in test env)
    expect([200, 400]).toContain(response.status);

    if (response.status === 200) {
      const result = await response.json();
      expect(result.results).toBeDefined();
      expect(result.results.summary).toBeDefined();
    }
  });

  it("should return error when both text and url provided", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT, url: "https://example.com/text.txt" })
    });

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.code).toBeDefined();
  });

  it("should return error for invalid URL format", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ url: "not-a-valid-url" })
    });

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe("INVALID_URL");
  });

  it("should return error for unreachable URL", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ url: "https://nonexistent-deepgram-test-domain-12345.com/file.txt" })
    });

    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe("INVALID_URL");
  });

  // Optional Feature Tests
  it("should include topics with segments structure when topics=true", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?topics=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.results).toBeDefined();
    expect(result.results.topics).toBeDefined();
    expect(result.results.topics.segments).toBeDefined();
    expect(Array.isArray(result.results.topics.segments)).toBe(true);

    if (result.results.topics.segments.length > 0) {
      const segment = result.results.topics.segments[0];
      expect(segment).toHaveProperty('text');
      expect(segment).toHaveProperty('start_word');
      expect(segment).toHaveProperty('end_word');
      expect(segment).toHaveProperty('topics');
      expect(Array.isArray(segment.topics)).toBe(true);

      if (segment.topics.length > 0) {
        expect(segment.topics[0]).toHaveProperty('topic');
        expect(segment.topics[0]).toHaveProperty('confidence_score');
        expect(typeof segment.topics[0].topic).toBe('string');
        expect(typeof segment.topics[0].confidence_score).toBe('number');
      }
    }
  });

  it("should include sentiments with segments and average when sentiment=true", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?sentiment=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.results).toBeDefined();
    expect(result.results.sentiments).toBeDefined();
    expect(result.results.sentiments.segments).toBeDefined();
    expect(Array.isArray(result.results.sentiments.segments)).toBe(true);
    expect(result.results.sentiments.average).toBeDefined();

    if (result.results.sentiments.segments.length > 0) {
      const segment = result.results.sentiments.segments[0];
      expect(segment).toHaveProperty('text');
      expect(segment).toHaveProperty('start_word');
      expect(segment).toHaveProperty('end_word');
      expect(segment).toHaveProperty('sentiment');
      expect(segment).toHaveProperty('sentiment_score');
      expect(['positive', 'negative', 'neutral']).toContain(segment.sentiment);
      expect(typeof segment.sentiment_score).toBe('number');
    }

    expect(result.results.sentiments.average).toHaveProperty('sentiment');
    expect(result.results.sentiments.average).toHaveProperty('sentiment_score');
    expect(['positive', 'negative', 'neutral']).toContain(result.results.sentiments.average.sentiment);
    expect(typeof result.results.sentiments.average.sentiment_score).toBe('number');
  });

  it("should include intents with segments structure when intents=true", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?intents=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.results).toBeDefined();
    expect(result.results.intents).toBeDefined();
    expect(result.results.intents.segments).toBeDefined();
    expect(Array.isArray(result.results.intents.segments)).toBe(true);

    if (result.results.intents.segments.length > 0) {
      const segment = result.results.intents.segments[0];
      expect(segment).toHaveProperty('text');
      expect(segment).toHaveProperty('start_word');
      expect(segment).toHaveProperty('end_word');
      expect(segment).toHaveProperty('intents');
      expect(Array.isArray(segment.intents)).toBe(true);

      if (segment.intents.length > 0) {
        expect(segment.intents[0]).toHaveProperty('intent');
        expect(segment.intents[0]).toHaveProperty('confidence_score');
        expect(typeof segment.intents[0].intent).toBe('string');
        expect(typeof segment.intents[0].confidence_score).toBe('number');
      }
    }
  });

  it("should handle multiple features simultaneously", async () => {
    const response = await fetch(`${BASE_URL}${ENDPOINT}?summarize=true&topics=true&sentiment=true&intents=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...await authHeaders(BASE_URL)
      },
      body: JSON.stringify({ text: SAMPLE_TEXT })
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.results).toBeDefined();

    // All features should be present
    expect(result.results.summary).toBeDefined();
    expect(result.results.topics).toBeDefined();
    expect(result.results.sentiments).toBeDefined();
    expect(result.results.intents).toBeDefined();
  });

});

