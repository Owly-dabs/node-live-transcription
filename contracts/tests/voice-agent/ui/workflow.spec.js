import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Voice Agent UI Workflow', () => {
  test('should connect, send message, and disconnect', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    await page.goto(BASE_URL);
    await page.getByRole('button', { name: ' Connect' }).click();

    // Wait for connection to be fully established (Welcome → Settings → SettingsApplied)
    await page.waitForTimeout(3000);

    await page.getByRole('textbox', { name: 'Type a message...' }).click();
    await page.getByRole('textbox', { name: 'Type a message...' }).fill('testing');
    await page.getByRole('button', { name: ' Send' }).click();
    await expect(page.locator('#connectionStatus')).toContainText('Connected');

    // Wait for agent to respond before disconnecting
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: ' Disconnect' }).click();
    await expect(page.locator('#connectionStatus')).toContainText('Disconnected');
  }, 60000);

  test('should have required UI elements', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for Connect button
    await expect(page.getByRole('button', { name: ' Connect' })).toBeVisible();

    // Check for connection status indicator
    await expect(page.locator('#connectionStatus')).toBeVisible();

    // Check for message textbox
    await expect(page.getByRole('textbox', { name: 'Type a message...' })).toBeVisible();
  });
});
