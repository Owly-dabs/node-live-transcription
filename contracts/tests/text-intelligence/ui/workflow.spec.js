import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const SAMPLE_TEXT = 'testing testing testing';

test.describe('Text Intelligence UI Workflow', () => {
  test('should complete full text intelligence workflow via UI', async ({ page }) => {
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

    // 2. Enter text in the input field
    try {
      const textInput = page.getByRole('textbox', { name: 'Enter Text' });
      await textInput.click();
      await textInput.fill(SAMPLE_TEXT);
    } catch (error) {
      throw new Error(
        `❌ Could not enter text in input field\n` +
        `💡 Likely cause: Text input field not found or not interactive\n` +
        `🔧 How to fix:\n` +
        `   1. Check that frontend submodule is up to date: git submodule update --remote\n` +
        `   2. Verify text input has role="textbox" and accessible name\n` +
        `   3. Check browser console for JavaScript errors\n` +
        `Original error: ${error.message}`
      );
    }

    // 3. Select intelligence features (Topic Detection, Sentiment, Intent)
    try {
      await page.getByRole('checkbox', { name: 'Topic Detection' }).check();
      await page.getByRole('checkbox', { name: 'Sentiment Analysis' }).check();
      await page.getByRole('checkbox', { name: 'Intent Recognition' }).check();
    } catch (error) {
      throw new Error(
        `❌ Could not select intelligence features\n` +
        `💡 Likely cause: Feature checkboxes not found or not interactive\n` +
        `🔧 How to fix:\n` +
        `   1. Verify checkboxes have proper role and accessible names\n` +
        `   2. Check that features are rendering correctly\n` +
        `   3. Ensure frontend JavaScript loaded properly\n` +
        `Original error: ${error.message}`
      );
    }

    // 4. Click analyze button
    try {
      const analyzeButton = page.getByRole('button', { name: 'Analyze Text' });
      await analyzeButton.click();
    } catch (error) {
      throw new Error(
        `❌ Could not click Analyze Text button\n` +
        `💡 Likely cause: Button not found or disabled\n` +
        `🔧 How to fix:\n` +
        `   1. Check that button has proper role and name attributes\n` +
        `   2. Verify button is not disabled by form validation\n` +
        `Original error: ${error.message}`
      );
    }

    // 5. Wait for analysis results and verify input text shown
    try {
      await expect(page.locator('#mainContent')).toContainText(SAMPLE_TEXT, {
        timeout: 15000
      });
    } catch (error) {
      throw new Error(
        `❌ Analysis results did not appear or doesn't show input text\n` +
        `💡 Likely cause: API request failed or UI didn't update\n` +
        `🔧 How to fix:\n` +
        `   1. Check backend is running on port 8081\n` +
        `   2. Verify /text-intelligence/analyze endpoint is working\n` +
        `   3. Check browser console and network tab for errors\n` +
        `   4. Ensure DEEPGRAM_API_KEY is set in .env\n` +
        `Original error: ${error.message}`
      );
    }
  });

  test('should have required UI elements', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for text input
    await expect(page.getByRole('textbox', { name: 'Enter Text' })).toBeVisible();

    // Check for feature checkboxes
    await expect(page.getByRole('checkbox', { name: 'Topic Detection' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Sentiment Analysis' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Intent Recognition' })).toBeVisible();

    // Check for analyze button
    await expect(page.getByRole('button', { name: 'Analyze Text' })).toBeVisible();

    // Check for main content area
    await expect(page.locator('#mainContent')).toBeVisible();
  });
});
