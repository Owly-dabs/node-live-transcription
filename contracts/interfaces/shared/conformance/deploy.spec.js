import { describe, it, expect, beforeAll } from "vitest";

/**
 * Deploy Conformance Tests
 *
 * Tests that the production deployment injects required HTML directives:
 * - <base href="/{starter-name}/"> for subpath routing via dx-router
 *
 * These tests only run when SESSION_AUTH=true (production/external).
 * In dev mode they are skipped automatically.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const SESSION_AUTH = process.env.SESSION_AUTH === "true";

describe.skipIf(!SESSION_AUTH)("Deploy Conformance:", () => {
  let html;

  // Fetch the HTML page once for all tests
  beforeAll(async () => {
    const response = await fetch(BASE_URL, {
      headers: { Accept: "text/html" },
    });
    expect(response.ok).toBe(true);
    html = await response.text();
  });

  it("should set a base href matching the preview subpath", () => {
    const match = html.match(/<base\s+href="([^"]+)"/);

    expect(match, "Missing <base href> tag in HTML").not.toBeNull();

    const basePath = match[1];
    // Base path should be a non-empty path starting and ending with /
    expect(basePath).toMatch(/^\/[a-z0-9-]+\/$/);

    // If we can derive the starter name from BASE_URL, verify it matches
    const urlPath = new URL(BASE_URL).pathname.replace(/\/$/, "");
    if (urlPath) {
      const expectedBase = `${urlPath}/`;
      expect(basePath).toBe(expectedBase);
    }
  });
});
