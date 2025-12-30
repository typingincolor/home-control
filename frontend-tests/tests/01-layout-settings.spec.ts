/**
 * Settings Page Layout Tests
 *
 * Verifies the Settings page displays correctly on Raspberry Pi 7" (800x480):
 * - No overlapping elements
 * - No cutoffs
 * - Minimum edge spacing
 * - All controls accessible
 */

import { test, expect } from '@playwright/test';
import { VIEWPORTS, LAYOUT, SELECTORS } from '../src/constants';
import {
  assertWithinViewport,
  assertMinEdgeSpacing,
  assertNoCutoffs,
} from '../src/layout-assertions';
import * as api from '../src/api-client';

test.describe('Settings Page Layout - Raspberry Pi 7"', () => {
  test.use({ viewport: VIEWPORTS.raspberryPi });

  test.beforeEach(async ({ page }) => {
    // Reset to fresh state to show settings page
    await api.resetToFresh();

    // Navigate with cleared localStorage by using a context script
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/');
    await page.waitForSelector('.settings-page', { timeout: 10000 });
  });

  test('should display settings page within viewport', async ({ page }) => {
    await assertWithinViewport(page, '.settings-page');
  });

  test('should have Philips Hue toggle visible and accessible', async ({ page }) => {
    const hueToggle = page.locator('.service-toggle').filter({ hasText: 'Philips Hue' });
    await expect(hueToggle).toBeVisible();
    await expect(hueToggle).toBeInViewport();

    // Check the toggle row is clickable (minimum touch target)
    const toggleBox = await hueToggle.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
  });

  test('should have Hive toggle visible and accessible', async ({ page }) => {
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive' });
    await expect(hiveToggle).toBeVisible();
    await expect(hiveToggle).toBeInViewport();

    const toggleBox = await hiveToggle.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
  });

  test('should have location detect button visible', async ({ page }) => {
    const detectButton = page.getByRole('button', { name: /detect/i });
    await expect(detectButton).toBeVisible();
    await expect(detectButton).toBeInViewport();

    const buttonBox = await detectButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.width).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(LAYOUT.MIN_BUTTON_SIZE);
  });

  test('should have minimum edge spacing for content', async ({ page }) => {
    const settingsContent = page.locator('.settings-page');
    await assertMinEdgeSpacing(page, '.settings-page', LAYOUT.MIN_EDGE_SPACING);
  });

  test('should not have any elements cut off', async ({ page }) => {
    await assertNoCutoffs(page, [
      '.settings-page',
      '.service-toggle',
    ]);
  });

  test('should fit all content without scrolling on Raspberry Pi viewport', async ({ page }) => {
    // Check page doesn't require scrolling
    const needsScroll = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });

    // On Raspberry Pi 7" (480px height), settings should fit without scroll
    expect(needsScroll).toBe(false);
  });

  test('toggles should not overlap with each other', async ({ page }) => {
    const hueToggle = page.locator('.service-toggle').filter({ hasText: 'Philips Hue' });
    const hiveToggle = page.locator('.service-toggle').filter({ hasText: 'Hive' });

    const hueBox = await hueToggle.boundingBox();
    const hiveBox = await hiveToggle.boundingBox();

    expect(hueBox).not.toBeNull();
    expect(hiveBox).not.toBeNull();

    // Toggles should be vertically stacked with gap
    if (hueBox && hiveBox) {
      const gap = hiveBox.y - (hueBox.y + hueBox.height);
      expect(gap).toBeGreaterThanOrEqual(LAYOUT.MIN_COMPONENT_GAP);
    }
  });
});
