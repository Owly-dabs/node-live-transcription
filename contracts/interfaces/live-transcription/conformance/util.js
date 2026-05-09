import { getTestSessionToken, getWsProtocols } from "../../../tests/shared/test-helpers.js";

// Base WebSocket URL for live transcription conformance tests
export const WS_URL = process.env.WS_URL || "ws://localhost:3000";

// HTTP base URL for fetching session tokens (derived from WS_URL)
export const HTTP_BASE_URL = process.env.BASE_URL || WS_URL.replace(/^ws/, "http");

export { getTestSessionToken, getWsProtocols };

// Helper to wait for a specific number of transcripts
export const waitForTranscripts = (transcripts, count, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkTranscripts = () => {
      if (transcripts.length >= count) {
        resolve(transcripts);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for ${count} transcripts. Got ${transcripts.length} transcripts.`));
        return;
      }

      setTimeout(checkTranscripts, 100);
    };

    checkTranscripts();
  });
};

// Helper to wait for final transcripts only
export const waitForFinalTranscripts = (transcripts, count, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkFinalTranscripts = () => {
      const finalTranscripts = transcripts.filter(t => t.is_final);

      if (finalTranscripts.length >= count) {
        resolve(finalTranscripts);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for ${count} final transcripts. Got ${finalTranscripts.length} final transcripts.`));
        return;
      }

      setTimeout(checkFinalTranscripts, 100);
    };

    checkFinalTranscripts();
  });
};

