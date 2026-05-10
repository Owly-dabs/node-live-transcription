import { test, expect } from '@playwright/test';
import { compareTwoStrings } from 'string-similarity';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const SIMILARITY_THRESHOLD = 0.80; // 80% match required - allows for minor punctuation variations

// Stanford debate audio transcript (from card-spacewalk)
const EXPECTED_TRANSCRIPT = `so the logic behind this article he said please pirate my cut my songs because if everybody knows my songs and everybody comes to my concerts i'll make much more money than if everybody buys my records and it makes sense you know so another problem the big five record labels distributed eighty five percent of music that is distributed worldwide`;

test.describe('Transcription UI Workflow', () => {
  test('should complete full transcription workflow via UI', async ({ page }) => {
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

    // 2. Wait for page to load and card to be enabled
    try {
      await page.waitForSelector('#card-spacewalk', { state: 'visible', timeout: 10000 });
    } catch (error) {
      throw new Error(
        `❌ Could not find #card-spacewalk element\n` +
        `💡 Likely cause: Frontend didn't load correctly or HTML structure changed\n` +
        `🔧 How to fix:\n` +
        `   1. Check that frontend submodule is up to date: git submodule update --remote\n` +
        `   2. Verify frontend built correctly: cd frontend && npm install && npm run build\n` +
        `   3. Check browser console for JavaScript errors\n` +
        `   4. Ensure the audio selection cards are rendering properly\n` +
        `Original error: ${error.message}`
      );
    }

    try {
      await page.waitForSelector('#card-spacewalk:not([class*="disabled"])', { timeout: 5000 });
    } catch (error) {
      throw new Error(
        `❌ Audio card #card-spacewalk is disabled\n` +
        `💡 Likely cause: Frontend JavaScript hasn't finished initializing\n` +
        `🔧 How to fix:\n` +
        `   1. Check browser console for JavaScript errors\n` +
        `   2. Verify main.js is loading correctly\n` +
        `   3. Ensure frontend dependencies are installed: cd frontend && npm install\n` +
        `Original error: ${error.message}`
      );
    }

    // 3. Select spacewalk audio (Stanford debate)
    try {
      await page.locator('#card-spacewalk').click();
    } catch (error) {
      throw new Error(
        `❌ Could not click #card-spacewalk element\n` +
        `💡 Likely cause: Element is not clickable or obscured\n` +
        `🔧 How to fix: Check that the card element is properly styled and interactive\n` +
        `Original error: ${error.message}`
      );
    }

    // 4. Wait for transcribe button to be enabled and click
    try {
      await page.waitForSelector('#transcribeBtn:not([disabled])', { timeout: 5000 });
    } catch (error) {
      throw new Error(
        `❌ Transcribe button #transcribeBtn is disabled or not found\n` +
        `💡 Likely cause: Form validation didn't pass or button not rendering\n` +
        `🔧 How to fix:\n` +
        `   1. Check that audio selection triggers form validation\n` +
        `   2. Verify updateFormValidation() function in main.js\n` +
        `   3. Ensure #transcribeBtn element exists in HTML\n` +
        `Original error: ${error.message}`
      );
    }

    try {
      await page.locator('#transcribeBtn').click();
    } catch (error) {
      throw new Error(
        `❌ Could not click transcribe button\n` +
        `💡 Likely cause: Button not clickable or JavaScript error on click\n` +
        `🔧 How to fix: Check handleTranscribe() function in main.js for errors\n` +
        `Original error: ${error.message}`
      );
    }

    // 5. Wait for results to appear (look for distinctive phrase)
    try {
      await page.waitForSelector('text=/pirate|concert|record/i', { timeout: 45000 });
    } catch (error) {
      const pageContent = await page.content();
      throw new Error(
        `❌ Transcription results did not appear within 30 seconds\n` +
        `💡 Likely cause: Backend not processing request or API endpoint failing\n` +
        `🔧 How to fix:\n` +
        `   1. Check backend server is running on port 8081\n` +
        `   2. Verify POST /stt/transcribe endpoint exists and is working\n` +
        `   3. Check backend logs for errors\n` +
        `   4. Test API directly: curl -X POST ${BASE_URL.replace('8080', '8081')}/stt/transcribe\n` +
        `   5. Check browser Network tab for failed requests\n` +
        `Original error: ${error.message}`
      );
    }

    // 6. Extract transcript text from the specific transcript element
    let transcriptText;
    try {
      transcriptText = await page.textContent('.transcript-text');
    } catch (error) {
      throw new Error(
        `❌ Could not find .transcript-text element\n` +
        `💡 Likely cause: Results rendered but in unexpected format\n` +
        `🔧 How to fix:\n` +
        `   1. Check displayTranscript() function in main.js\n` +
        `   2. Verify that results use .transcript-text class\n` +
        `   3. Ensure transcript is being displayed correctly\n` +
        `Original error: ${error.message}`
      );
    }

    // 7. Normalize both texts (lowercase, collapse whitespace)
    const normalizedTranscript = transcriptText
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedExpected = EXPECTED_TRANSCRIPT
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // 8. Extract the beginning portion of the transcript (same length as expected)
    // The audio contains the full debate, but we only validate the opening excerpt
    const transcriptExcerpt = normalizedTranscript.substring(0, normalizedExpected.length + 50);

    // 9. Fuzzy match with similarity threshold
    const similarity = compareTwoStrings(transcriptExcerpt, normalizedExpected);

    console.log(`Transcript similarity: ${(similarity * 100).toFixed(2)}%`);

    if (similarity < SIMILARITY_THRESHOLD) {
      throw new Error(
        `❌ Transcript similarity too low: ${(similarity * 100).toFixed(2)}% (threshold: ${SIMILARITY_THRESHOLD * 100}%)\n` +
        `💡 Likely cause: Transcription API returned incorrect or incomplete results\n` +
        `🔧 How to fix:\n` +
        `   1. Check that backend is using correct Deepgram model (nova-3 recommended)\n` +
        `   2. Verify audio URL is correct: https://dpgr.am/stanford.mp3\n` +
        `   3. Check Deepgram API key is valid and has sufficient credits\n` +
        `   4. Inspect actual transcript vs expected:\n` +
        `      Expected (first 200 chars): ${normalizedExpected.substring(0, 200)}...\n` +
        `      Received (first 200 chars): ${transcriptExcerpt.substring(0, 200)}...`
      );
    }
  });

  test('should have required UI elements', async ({ page }) => {
    try {
      await page.goto(BASE_URL);
    } catch (error) {
      throw new Error(
        `❌ Failed to navigate to ${BASE_URL}\n` +
        `💡 Likely cause: Frontend server is not running\n` +
        `🔧 How to fix: Start the frontend with: make start\n` +
        `Original error: ${error.message}`
      );
    }

    // Check for required elements
    try {
      await expect(page.locator('#card-spacewalk')).toBeVisible({ timeout: 5000 });
    } catch (error) {
      throw new Error(
        `❌ Audio selection card #card-spacewalk is not visible\n` +
        `💡 Likely cause: Frontend HTML structure is incorrect or missing\n` +
        `🔧 How to fix:\n` +
        `   1. Verify frontend submodule is up to date: git submodule update --remote\n` +
        `   2. Check that index.html contains audio selection cards\n` +
        `   3. Ensure frontend JavaScript is loading correctly\n` +
        `Original error: ${error.message}`
      );
    }

    try {
      await expect(page.locator('#transcribeBtn')).toBeVisible({ timeout: 5000 });
    } catch (error) {
      throw new Error(
        `❌ Transcribe button #transcribeBtn is not visible\n` +
        `💡 Likely cause: Frontend HTML structure is missing the transcribe button\n` +
        `🔧 How to fix:\n` +
        `   1. Check that index.html contains <button id="transcribeBtn">\n` +
        `   2. Verify CSS isn't hiding the button (display: none)\n` +
        `   3. Ensure frontend is built correctly: cd frontend && npm run build\n` +
        `Original error: ${error.message}`
      );
    }
  });
});
