/**
 * Screenshot utility for README documentation
 * Takes a screenshot of the dashboard at 800x480 (Raspberry Pi viewport)
 *
 * Usage: node scripts/take-screenshot.js
 * Requirements: Dev server running (npm run dev), Playwright installed
 */
import { chromium } from '@playwright/test';

async function takeScreenshot() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 800, height: 480 },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/?demo=true');
  await page.waitForSelector('.main-panel', { timeout: 10000 });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: 'docs/dashboard-screenshot.png',
    fullPage: false,
  });

  console.log('Screenshot saved to docs/dashboard-screenshot.png');
  await browser.close();
}

takeScreenshot().catch(console.error);
