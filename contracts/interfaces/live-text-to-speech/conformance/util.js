import { getTestSessionToken, getWsProtocols } from "../../../tests/shared/test-helpers.js";

// WebSocket URL for live text-to-speech conformance tests
export const WS_URL = process.env.WS_URL || "ws://localhost:3000";

// HTTP base URL for fetching session tokens (derived from WS_URL)
export const HTTP_BASE_URL = process.env.BASE_URL || WS_URL.replace(/^ws/, "http");

export { getTestSessionToken, getWsProtocols };

// Helper function to wait for WebSocket messages
export const waitForMessages = (ws, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const messages = [];
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for messages after ${timeout}ms`));
    }, timeout);

    const messageHandler = (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received JSON message:', message.type);
        messages.push(message);

        // Resolve after receiving metadata or error
        if (message.type === 'Metadata' || message.type === 'Error') {
          clearTimeout(timer);
          ws.removeListener('message', messageHandler);
          ws.removeListener('close', closeHandler);
          console.log('Received target message, returning', messages.length, 'messages');
          resolve(messages);
        }
      } catch (error) {
        // Binary data (audio chunks)
        console.log('Received binary data, size:', data.length);
        messages.push({ type: 'binary', data: data });
      }
    };

    const closeHandler = () => {
      clearTimeout(timer);
      ws.removeListener('message', messageHandler);
      ws.removeListener('close', closeHandler);
      console.log('WebSocket closed, returning', messages.length, 'messages');
      resolve(messages);
    };

    ws.on('message', messageHandler);
    ws.on('close', closeHandler);
  });
};

// Helper function to wait for audio chunks
export const waitForAudioChunks = (ws, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const audioChunks = [];
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for audio chunks after ${timeout}ms`));
    }, timeout);

    const messageHandler = (data) => {
      // Check if it's binary data (audio chunks)
      if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
        console.log('Received binary audio chunk, size:', data.length);
        audioChunks.push(data);

        // Resolve after receiving a reasonable amount of audio data
        if (audioChunks.length >= 5) {
          clearTimeout(timer);
          ws.removeListener('message', messageHandler);
          ws.removeListener('close', closeHandler);
          console.log('Received sufficient audio chunks, returning', audioChunks.length, 'chunks');
          resolve(audioChunks);
        }
      } else {
        // Try to parse as JSON to see if it's a message
        try {
          const message = JSON.parse(data.toString());
          console.log('Received JSON message:', message.type);
          // If it's not audio, we can continue waiting
        } catch (error) {
          // If it's not JSON and not binary, it might still be audio
          console.log('Received non-JSON data, treating as audio, size:', data.length);
          audioChunks.push(data);

          // Resolve after receiving a reasonable amount of audio data
          if (audioChunks.length >= 5) {
            clearTimeout(timer);
            ws.removeListener('message', messageHandler);
            ws.removeListener('close', closeHandler);
            console.log('Received sufficient audio chunks, returning', audioChunks.length, 'chunks');
            resolve(audioChunks);
          }
        }
      }
    };

    const closeHandler = () => {
      clearTimeout(timer);
      ws.removeListener('message', messageHandler);
      ws.removeListener('close', closeHandler);
      console.log('WebSocket closed, returning', audioChunks.length, 'audio chunks');
      resolve(audioChunks);
    };

    ws.on('message', messageHandler);
    ws.on('close', closeHandler);
  });
};
