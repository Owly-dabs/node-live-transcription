import fs from 'fs';
import path from 'path';

/**
 * Simple TOML parser for deepgram.toml [meta] section
 * @param {string} filePath - Path to TOML file
 * @returns {Object} Parsed TOML with meta section
 */
export function parseToml(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`TOML file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Parse [meta] section
  const metaMatch = content.match(/\[meta\]([\s\S]*?)(?=\n\[|$)/);
  const meta = {};

  if (metaMatch) {
    metaMatch[1].split('\n').forEach(line => {
      // Match key = "value" or key = value
      const match = line.match(/^\s*(\w+)\s*=\s*"?([^"]*)"?\s*$/);
      if (match && match[1] && match[2]) {
        meta[match[1]] = match[2];
      }
    });
  }

  return { meta };
}

/**
 * Normalize text for comparison (lowercase, collapse whitespace)
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Environment variables with defaults
 */
export const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
export const REPO_PATH = process.env.REPO_PATH || process.cwd();

// ============================================================================
// SESSION AUTH HELPERS
// ============================================================================

// Cached session token (shared across all tests in a suite run)
let _sessionToken = null;

/**
 * Fetches a session token from the backend.
 * The /api/session endpoint issues JWTs freely (rate-limited by Caddy in production).
 * Caches the token for subsequent calls within the same test run.
 *
 * @param {string} baseUrl - Backend base URL (e.g., "http://localhost:8081")
 * @returns {Promise<string>} JWT session token
 */
export async function getTestSessionToken(baseUrl) {
  if (_sessionToken) return _sessionToken;

  const response = await fetch(`${baseUrl}/api/session`);
  if (!response.ok) {
    throw new Error(`Failed to get session token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  _sessionToken = data.token;
  return _sessionToken;
}

/**
 * Returns Authorization header object for authenticated REST requests.
 *
 * @param {string} baseUrl - Backend base URL
 * @returns {Promise<Object>} Headers object with Authorization: Bearer <token>
 */
export async function authHeaders(baseUrl) {
  const token = await getTestSessionToken(baseUrl);
  return { "Authorization": `Bearer ${token}` };
}

/**
 * Returns WebSocket subprotocol array for authenticated connections.
 * Uses the access_token.<jwt> subprotocol pattern.
 *
 * @param {string} baseUrl - Backend base URL (HTTP, used to fetch the token)
 * @returns {Promise<string[]>} Array with single subprotocol string
 */
export async function getWsProtocols(baseUrl) {
  const token = await getTestSessionToken(baseUrl);
  return [`access_token.${token}`];
}
