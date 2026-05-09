import { getTestSessionToken, getWsProtocols } from "../../../tests/shared/test-helpers.js";

// Base WebSocket URL for voice agent conformance tests
export const WS_URL = process.env.WS_URL || "ws://localhost:3000";

// HTTP base URL for fetching session tokens (derived from WS_URL)
export const HTTP_BASE_URL = process.env.BASE_URL || WS_URL.replace(/^ws/, "http");

export { getTestSessionToken, getWsProtocols };

// Helper to wait for a specific message type
// Note: Longer default timeout to account for Deepgram connection and response time
export const waitForMessageType = (messages, type, timeout = 15000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkMessages = () => {
      const found = messages.find(msg => msg.type === type);

      if (found) {
        resolve(found);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for message type '${type}'. Received: ${messages.map(m => m.type).join(', ')}`));
        return;
      }

      setTimeout(checkMessages, 100);
    };

    checkMessages();
  });
};

// Helper to wait for multiple message types
// Note: Longer default timeout to account for Deepgram connection and response time
export const waitForMessageTypes = (messages, types, timeout = 15000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkMessages = () => {
      const foundAll = types.every(type =>
        messages.some(msg => msg.type === type)
      );

      if (foundAll) {
        resolve(messages);
        return;
      }

      if (Date.now() - startTime > timeout) {
        const receivedTypes = messages.map(m => m.type).join(', ');
        reject(new Error(`Timeout waiting for message types [${types.join(', ')}]. Received: ${receivedTypes}`));
        return;
      }

      setTimeout(checkMessages, 100);
    };

    checkMessages();
  });
};

// Minimal settings configuration
export const createMinimalSettings = () => ({
  type: "Settings",
  audio: {
    input: {
      encoding: "linear16",
      sample_rate: 24000
    },
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none"
    }
  },
  agent: {
    listen: {
      provider: {
        type: "deepgram",
        model: "nova-3"
      }
    },
    think: {
      provider: {
        type: "open_ai",
        model: "gpt-4o-mini"
      }
    },
    speak: {
      provider: {
        type: "deepgram",
        model: "aura-2-thalia-en"
      }
    }
  }
});

// Create InjectUserMessage payload
export const createInjectUserMessage = (content) => ({
  type: "InjectUserMessage",
  content
});

