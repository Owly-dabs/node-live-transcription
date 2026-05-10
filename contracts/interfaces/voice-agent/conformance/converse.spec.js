import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { WS_URL, HTTP_BASE_URL, getWsProtocols, createMinimalSettings, createInjectUserMessage, waitForMessageType, waitForMessageTypes } from "./util.js";

const ENDPOINT = process.env.VOICE_AGENT_ENDPOINT || "/api/voice-agent";

describe("Voice Agent Interface Conformance:", () => {

  it("should connect to WebSocket endpoint", async () => {
    const protocols = await getWsProtocols(HTTP_BASE_URL);
    const ws = new WebSocket(`${WS_URL}${ENDPOINT}`, protocols);

    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        console.log("WebSocket connected successfully");
        ws.close();
        resolve();
      });
      ws.on('error', (error) => {
        console.error("WebSocket connection failed:", error);
        reject(error);
      });
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
    });
  }, 10000);

  it("should receive Welcome message after connection", async () => {
    const protocols = await getWsProtocols(HTTP_BASE_URL);
    const ws = new WebSocket(`${WS_URL}${ENDPOINT}`, protocols);
    const messages = [];

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        messages.push(message);
      } catch (e) {
        // Ignore non-JSON messages (binary audio data)
      }
    });

    await new Promise((resolve, reject) => {
      ws.on('open', async () => {
        try {
          // Wait for Welcome from Deepgram (forwarded through starter app)
          const welcomeMsg = await waitForMessageType(messages, 'Welcome');
          expect(welcomeMsg.type).toBe('Welcome');
          expect(welcomeMsg.request_id).toBeDefined();
          ws.close();
          resolve();
        } catch (error) {
          ws.close();
          reject(error);
        }
      });
      ws.on('error', (error) => {
        reject(error);
      });
    });
  }, 20000);

  it("should accept minimal Settings message and respond with SettingsApplied", async () => {
    const protocols = await getWsProtocols(HTTP_BASE_URL);
    const ws = new WebSocket(`${WS_URL}${ENDPOINT}`, protocols);
    const messages = [];

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        messages.push(message);
      } catch (e) {
        // Ignore non-JSON messages
      }
    });

    await new Promise((resolve, reject) => {
      ws.on('open', async () => {
        try {
          // Wait for Welcome message from Deepgram
          await waitForMessageType(messages, 'Welcome');

          // Send Settings to Deepgram via starter app
          const settings = createMinimalSettings();
          ws.send(JSON.stringify(settings));

          // Wait for SettingsApplied from Deepgram
          const settingsAppliedMsg = await waitForMessageType(messages, 'SettingsApplied');
          expect(settingsAppliedMsg.type).toBe('SettingsApplied');

          ws.close();
          resolve();
        } catch (error) {
          ws.close();
          reject(error);
        }
      });
      ws.on('error', (error) => {
        reject(error);
      });
    });
  }, 25000);

  it("should accept InjectUserMessage and trigger agent response", async () => {
    const protocols = await getWsProtocols(HTTP_BASE_URL);
    const ws = new WebSocket(`${WS_URL}${ENDPOINT}`, protocols);
    const messages = [];

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        messages.push(message);
      } catch (e) {
        // Ignore non-JSON messages (binary audio data)
      }
    });

    await new Promise((resolve, reject) => {
      ws.on('open', async () => {
        try {
          // Wait for Welcome message from Deepgram
          await waitForMessageType(messages, 'Welcome');

          // Send Settings to establish the agent session
          const settings = createMinimalSettings();
          ws.send(JSON.stringify(settings));

          // Wait for SettingsApplied from Deepgram
          await waitForMessageType(messages, 'SettingsApplied');

          // Send InjectUserMessage to trigger agent response
          const injectMessage = createInjectUserMessage("Hello, how are you?");
          ws.send(JSON.stringify(injectMessage));

          // Wait for ConversationText with user role (the injected message)
          const userTextMsg = await waitForMessageType(messages, 'ConversationText', 20000);
          expect(userTextMsg.type).toBe('ConversationText');
          expect(userTextMsg.role).toBe('user');
          expect(userTextMsg.content).toBeDefined();

          // Wait for agent to respond - look for assistant ConversationText
          // Clear the first ConversationText from our search by waiting for a second one
          const assistantTextMsg = await new Promise((res, rej) => {
            const startTime = Date.now();
            const checkForAssistant = () => {
              const assistantMsg = messages.find(msg =>
                msg.type === 'ConversationText' && msg.role === 'assistant'
              );
              if (assistantMsg) {
                res(assistantMsg);
                return;
              }
              if (Date.now() - startTime > 30000) {
                rej(new Error('Timeout waiting for assistant ConversationText'));
                return;
              }
              setTimeout(checkForAssistant, 100);
            };
            checkForAssistant();
          });

          expect(assistantTextMsg.type).toBe('ConversationText');
          expect(assistantTextMsg.role).toBe('assistant');
          expect(assistantTextMsg.content).toBeDefined();

          ws.close();
          resolve();
        } catch (error) {
          ws.close();
          reject(error);
        }
      });
      ws.on('error', (error) => {
        reject(error);
      });
    });
  }, 45000);

  it("should reject invalid InjectUserMessage (missing content)", async () => {
    const protocols = await getWsProtocols(HTTP_BASE_URL);
    const ws = new WebSocket(`${WS_URL}${ENDPOINT}`, protocols);
    const messages = [];

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        messages.push(message);
      } catch (e) {
        // Ignore non-JSON messages
      }
    });

    await new Promise((resolve, reject) => {
      ws.on('open', async () => {
        try {
          // Wait for Welcome message from Deepgram
          await waitForMessageType(messages, 'Welcome');

          // Send Settings to establish the agent session
          const settings = createMinimalSettings();
          ws.send(JSON.stringify(settings));

          // Wait for SettingsApplied from Deepgram
          await waitForMessageType(messages, 'SettingsApplied');

          // Send invalid InjectUserMessage (missing content)
          const invalidInjectMessage = {
            type: "InjectUserMessage"
            // missing required 'content' field
          };
          ws.send(JSON.stringify(invalidInjectMessage));

          // Wait for Error message from Deepgram
          const errorMsg = await waitForMessageType(messages, 'Error');
          expect(errorMsg.type).toBe('Error');
          expect(errorMsg.code).toBeDefined();

          ws.close();
          resolve();
        } catch (error) {
          ws.close();
          reject(error);
        }
      });
      ws.on('error', (error) => {
        reject(error);
      });
    });
  }, 30000);

  it("should handle connection close gracefully", async () => {
    const protocols = await getWsProtocols(HTTP_BASE_URL);
    const ws = new WebSocket(`${WS_URL}${ENDPOINT}`, protocols);
    let connectionClosed = false;

    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        console.log("WebSocket opened, closing connection");
        ws.close();
      });
      ws.on('close', () => {
        console.log("WebSocket closed gracefully");
        connectionClosed = true;
        resolve();
      });
      ws.on('error', (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      });
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
    });

    expect(connectionClosed).toBe(true);
  }, 10000);

});

