import { describe, it, expect } from 'vitest';
import { parseToml } from '../../shared/test-helpers.js';
import { BASE_URL, REPO_PATH } from './util.js';
import path from 'path';

describe('Metadata API Contract', () => {
  it('should return metadata matching deepgram.toml [meta] section', async () => {
    // 1. Parse deepgram.toml [meta] section
    const tomlPath = path.join(REPO_PATH, 'deepgram.toml');
    const { meta: tomlMeta } = parseToml(tomlPath);

    expect(tomlMeta,
      '❌ deepgram.toml [meta] section is empty or invalid\n' +
      '💡 Likely cause: The [meta] section in deepgram.toml is missing or has no properties\n' +
      '🔧 How to fix: Add metadata fields to [meta] section in deepgram.toml'
    ).toBeDefined();

    expect(Object.keys(tomlMeta).length,
      '❌ deepgram.toml [meta] section has no properties\n' +
      '💡 Likely cause: The [meta] section exists but is empty\n' +
      '🔧 How to fix: Add properties like title, description, author, repository to [meta]'
    ).toBeGreaterThan(0);

    // 2. GET /api/metadata
    const response = await fetch(`${BASE_URL}/api/metadata`);

    expect(response.status,
      `❌ GET ${BASE_URL}/api/metadata returned ${response.status}\n` +
      '💡 Likely cause: The /api/metadata endpoint does not exist or is not accessible\n' +
      '🔧 How to fix:\n' +
      '   1. Ensure your backend server is running on the correct port\n' +
      `   2. Add a GET route for /api/metadata that returns the deepgram.toml [meta] section\n` +
      '   3. Example (Express): app.get("/api/metadata", (req, res) => res.json(metadata))'
    ).toBe(200);

    expect(response.headers.get('Content-Type'),
      `❌ /api/metadata returned Content-Type: ${response.headers.get('Content-Type')}\n` +
      '💡 Likely cause: The endpoint exists but is not returning JSON\n' +
      '🔧 How to fix: Ensure the endpoint returns JSON with Content-Type: application/json'
    ).toMatch(/application\/json/);

    const apiMeta = await response.json();
    expect(apiMeta,
      '❌ /api/metadata response body is empty\n' +
      '💡 Likely cause: The endpoint returned 200 but with no data\n' +
      '🔧 How to fix: Ensure the endpoint returns the metadata object from deepgram.toml'
    ).toBeDefined();

    // 3. EXACT MATCH: validate each field from TOML exists in API response
    const missingFields = [];
    const mismatchedFields = [];

    Object.keys(tomlMeta).forEach(key => {
      if (!apiMeta.hasOwnProperty(key)) {
        missingFields.push(key);
      } else if (apiMeta[key] !== tomlMeta[key]) {
        mismatchedFields.push({
          field: key,
          expected: tomlMeta[key],
          actual: apiMeta[key]
        });
      }
    });

    if (missingFields.length > 0) {
      throw new Error(
        `❌ API response is missing fields from deepgram.toml [meta] section\n` +
        `💡 Missing fields: ${missingFields.join(', ')}\n` +
        `🔧 How to fix: Ensure /api/metadata returns all fields from deepgram.toml [meta]:\n` +
        `   Expected: ${JSON.stringify(tomlMeta, null, 2)}\n` +
        `   Received: ${JSON.stringify(apiMeta, null, 2)}`
      );
    }

    if (mismatchedFields.length > 0) {
      const details = mismatchedFields.map(m =>
        `   ${m.field}: expected "${m.expected}", got "${m.actual}"`
      ).join('\n');

      throw new Error(
        `❌ API response fields don't match deepgram.toml values\n` +
        `💡 Mismatched fields:\n${details}\n` +
        `🔧 How to fix: Ensure /api/metadata returns exact values from deepgram.toml [meta]`
      );
    }
  });

  it('should return 200 OK for metadata endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/metadata`);
    expect(response.status,
      `❌ GET ${BASE_URL}/api/metadata returned ${response.status}\n` +
      '💡 Likely cause: The /api/metadata endpoint does not exist\n' +
      '🔧 How to fix: Add a GET /api/metadata endpoint to your backend server'
    ).toBe(200);
  });
});
