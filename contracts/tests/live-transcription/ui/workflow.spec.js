import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Live Transcription UI Workflow', () => {
  test('should connect and disconnect from live transcription', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    // 1. Navigate to app
    try {
      await page.goto(BASE_URL);
    } catch (error) {
      throw new Error(
        `❌ Failed to navigate to ${BASE_URL}\n` +
        `💡 Likely cause: Frontend server is not running or not accessible\n` +
        `🔧 How to fix:\n` +
        `   1. Ensure frontend is running: make start\n` +
        `   2. Check that port 8080 is not blocked by firewall\n` +
        `   3. Verify BASE_URL environment variable is correct\n` +
        `Original error: ${error.message}`
      );
    }

    // 2. Click Connect button
    try {
      await page.getByRole('button', { name: ' Connect' }).click();
    } catch (error) {
      throw new Error(
        `❌ Could not click Connect button\n` +
        `💡 Likely cause: Button not found or disabled\n` +
        `🔧 How to fix:\n` +
        `   1. Check that Connect button has proper role and name\n` +
        `   2. Verify button is enabled on page load\n` +
        `   3. Check browser console for JavaScript errors\n` +
        `Original error: ${error.message}`
      );
    }

    // 3. Verify connection status shows "Connected"
    try {
      await expect(page.locator('#connection-status')).toContainText('Connected', {
        timeout: 10000
      });
    } catch (error) {
      throw new Error(
        `❌ Connection status did not show "Connected"\n` +
        `💡 Likely cause: WebSocket connection failed or status not updating\n` +
        `🔧 How to fix:\n` +
        `   1. Check backend WebSocket proxy is running on port 8081\n` +
        `   2. Verify Deepgram API key is valid in .env\n` +
        `   3. Check browser console for WebSocket errors\n` +
        `   4. Ensure Deepgram WebSocket endpoint is accessible\n` +
        `Original error: ${error.message}`
      );
    }

    // 4. Click Disconnect button
    try {
      await page.getByRole('button', { name: ' Disconnect' }).click();
    } catch (error) {
      throw new Error(
        `❌ Could not click Disconnect button\n` +
        `💡 Likely cause: Button not found after connection\n` +
        `🔧 How to fix:\n` +
        `   1. Check that Disconnect button replaces Connect button\n` +
        `   2. Verify button state management works correctly\n` +
        `Original error: ${error.message}`
      );
    }

    // 5. Verify connection status shows "Disconnected"
    try {
      await expect(page.locator('#connection-status')).toContainText('Disconnected', {
        timeout: 5000
      });
    } catch (error) {
      throw new Error(
        `❌ Connection status did not show "Disconnected"\n` +
        `💡 Likely cause: WebSocket disconnect failed or status not updating\n` +
        `🔧 How to fix:\n` +
        `   1. Check that WebSocket close is handled properly\n` +
        `   2. Verify frontend updates status on disconnect\n` +
        `   3. Check browser console for errors\n` +
        `Original error: ${error.message}`
      );
    }
  });

  test('should have required UI elements', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for Connect button
    await expect(page.getByRole('button', { name: ' Connect' })).toBeVisible();

    // Check for connection status indicator
    await expect(page.locator('#connection-status')).toBeVisible();
  });
});
