import { describe, it, expect } from 'vitest';
import { parseToml } from '../../shared/test-helpers.js';
import { BASE_URL, REPO_PATH } from './util.js';
import path from 'path';

describe('Metadata API Contract', () => {
  it('should return metadata matching deepgram.toml [meta] section', async () => {
    // 1. Parse deepgram.toml [meta] section
    const tomlPath = path.join(REPO_PATH, 'deepgram.toml');
    const { meta: tomlMeta } = parseToml(tomlPath);

    expect(tomlMeta).toBeDefined();
    expect(Object.keys(tomlMeta).length).toBeGreaterThan(0);

    // 2. GET /api/metadata
    const response = await fetch(`${BASE_URL}/api/metadata`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toMatch(/application\/json/);

    const apiMeta = await response.json();
    expect(apiMeta).toBeDefined();

    // 3. EXACT MATCH: validate each field from TOML exists in API response
    Object.keys(tomlMeta).forEach(key => {
      expect(apiMeta).toHaveProperty(key);
      expect(apiMeta[key]).toBe(tomlMeta[key]);
    });
  });

  it('should return 200 OK for metadata endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/metadata`);
    expect(response.status).toBe(200);
  });
});
