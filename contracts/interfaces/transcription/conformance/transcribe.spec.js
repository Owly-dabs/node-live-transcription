import { describe, it, expect } from "vitest";
import { BASE_URL, authHeaders } from "./util.js";

const ENDPOINT = process.env.TRANSCRIPTION_ENDPOINT || "/api/transcription";
const SAMPLE_AUDIO_URL = "https://dpgr.am/spacewalk.wav";

describe("Transcription Interface Conformance:", () => {
  it("should transcribe audio from URL via multipart/form-data", async () => {
    const formData = new FormData();
    formData.append("url", SAMPLE_AUDIO_URL);

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { ...await authHeaders(BASE_URL) },
      body: formData,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/application\/json/);

    const result = await response.json();
    expect(result.transcript).toBeDefined();
    expect(typeof result.transcript).toBe("string");
    expect(result.transcript.length).toBeGreaterThan(0);
  });

  it("should accept model parameter with URL", async () => {
    const formData = new FormData();
    formData.append("url", SAMPLE_AUDIO_URL);
    formData.append("model", "nova-2");

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { ...await authHeaders(BASE_URL) },
      body: formData,
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.transcript).toBeDefined();
  });

  it("should transcribe audio from file upload via multipart/form-data", async () => {
    // Fetch the sample audio file
    const audioResponse = await fetch(SAMPLE_AUDIO_URL);
    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], "test.wav", { type: "audio/wav" });

    const formData = new FormData();
    formData.append("file", audioFile);

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { ...await authHeaders(BASE_URL) },
      body: formData,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toMatch(/application\/json/);

    const result = await response.json();
    expect(result.transcript).toBeDefined();
    expect(typeof result.transcript).toBe("string");
    expect(result.transcript.length).toBeGreaterThan(0);
  });

  it("should accept model parameter with file upload", async () => {
    // Fetch the sample audio file
    const audioResponse = await fetch(SAMPLE_AUDIO_URL);
    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], "test.wav", { type: "audio/wav" });

    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", "nova-2");

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { ...await authHeaders(BASE_URL) },
      body: formData,
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.transcript).toBeDefined();
  });

  it("should return error for invalid URL format", async () => {
    const formData = new FormData();
    formData.append("url", "not-a-valid-url");

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { ...await authHeaders(BASE_URL) },
      body: formData,
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.code).toBeDefined();
    expect(result.error.message).toBeDefined();
  });

  it("should handle unreachable URL gracefully", async () => {
    const formData = new FormData();
    formData.append("url", "https://nonexistent-domain-12345.com/audio.wav");

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { ...await authHeaders(BASE_URL) },
      body: formData,
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.code).toBeDefined();
  });

  it("should handle invalid form fields gracefully", async () => {
    const formData = new FormData();
    formData.append("url", SAMPLE_AUDIO_URL);
    formData.append("invalid_param", "value");

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { ...await authHeaders(BASE_URL) },
      body: formData,
    });

    // Should either ignore unknown param or return 400
    expect([200, 400]).toContain(response.status);
  });

  it.skip("should return error when neither file nor url is provided", async () => {
    const formData = new FormData();

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: { ...await authHeaders(BASE_URL) },
      body: formData,
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.code).toBeDefined();
    expect(result.error.message).toBeDefined();
  });
});
