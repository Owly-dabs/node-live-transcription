import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const SAMPLE_TEXT = 'test speech';

test.describe('Text-to-Speech UI Workflow', () => {
  test('should complete full text-to-speech workflow via UI', async ({ page }) => {
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

    // 3. Click generate audio button
    try {
      const generateButton = page.getByRole('button', { name: 'Generate Audio' });
      await generateButton.click();
    } catch (error) {
      throw new Error(
        `❌ Could not click Generate Audio button\n` +
        `💡 Likely cause: Button not found or disabled\n` +
        `🔧 How to fix:\n` +
        `   1. Check that button has proper role and name attributes\n` +
        `   2. Verify button is not disabled by form validation\n` +
        `Original error: ${error.message}`
      );
    }

    // 4. Wait for audio generation and verify result
    try {
      // Wait for the main content area to show the input text (confirmation)
      await expect(page.locator('#mainContent')).toContainText(SAMPLE_TEXT, {
        timeout: 10000
      });
    } catch (error) {
      throw new Error(
        `❌ Generated audio section did not appear or doesn't show input text\n` +
        `💡 Likely cause: API request failed or UI didn't update\n` +
        `🔧 How to fix:\n` +
        `   1. Check backend is running on port 8081\n` +
        `   2. Verify /tts/synthesize endpoint is working\n` +
        `   3. Check browser console and network tab for errors\n` +
        `   4. Ensure DEEPGRAM_API_KEY is set in .env\n` +
        `Original error: ${error.message}`
      );
    }

    // 5. Verify audio player appears in main content
    try {
      const audioPlayer = page.locator('#mainContent audio');
      await expect(audioPlayer).toBeVisible({ timeout: 5000 });
    } catch (error) {
      throw new Error(
        `❌ Audio player did not appear after generation\n` +
        `💡 Likely cause: Frontend didn't render audio element or API returned no data\n` +
        `🔧 How to fix:\n` +
        `   1. Check that API returns audio data successfully\n` +
        `   2. Verify frontend creates <audio> element with generated audio\n` +
        `   3. Check browser console for errors\n` +
        `Original error: ${error.message}`
      );
    }
  });

  test('should have required UI elements', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check for text input
    await expect(page.getByRole('textbox', { name: 'Enter Text' })).toBeVisible();

    // Check for generate button
    await expect(page.getByRole('button', { name: 'Generate Audio' })).toBeVisible();

    // Check for main content area
    await expect(page.locator('#mainContent')).toBeVisible();
  });
});
