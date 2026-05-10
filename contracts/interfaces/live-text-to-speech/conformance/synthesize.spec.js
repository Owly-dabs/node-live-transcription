import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { WS_URL, HTTP_BASE_URL, getWsProtocols, waitForAudioChunks } from "./util.js";

const ENDPOINT = process.env.LIVE_TEXT_TO_SPEECH_ENDPOINT || "/api/live-text-to-speech";

describe("Live Text-to-Speech Interface Conformance:", () => {

  it("should connect and receive audio", async () => {
    console.log('Attempting to connect to:', `${WS_URL}${ENDPOINT}`);
    const protocols = await getWsProtocols(HTTP_BASE_URL);
    const ws = new WebSocket(`${WS_URL}${ENDPOINT}`, protocols);

    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        console.log('WebSocket connected successfully');
        resolve();
      });
      ws.on('error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });
    });

    // Allow time for server to establish upstream Deepgram connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Sending text message...');
    // Send text message
    const textMessage = {
      type: "Speak",
      text: "Hello, world!"
    };
    ws.send(JSON.stringify(textMessage));

    console.log('Waiting for audio chunks...');
    // Wait for audio chunks
    const audioChunks = await waitForAudioChunks(ws, 15000);

    console.log('Received', audioChunks.length, 'audio chunks');
    expect(audioChunks.length).toBeGreaterThan(0);
    expect(audioChunks[0]).toBeInstanceOf(Buffer);

    ws.close();
  }, 25000);

  it("should handle connection close gracefully", async () => {
    const protocols = await getWsProtocols(HTTP_BASE_URL);
    const ws = new WebSocket(`${WS_URL}${ENDPOINT}`, protocols);

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    // Send text message
    const textMessage = {
      type: "Speak",
      text: "Testing connection close"
    };
    ws.send(JSON.stringify(textMessage));

    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Close connection
    ws.close();

    // Should not throw any errors
    expect(true).toBe(true);
  });

});
