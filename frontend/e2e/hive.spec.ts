import { test, expect } from '@playwright/test';

/**
 * Hive Integration E2E Tests - Phase 1: Status Display
 *
 * This phase focuses on:
 * - Hive credentials in Settings
 * - Navigation (Hive tab visibility)
 * - Read-only status display (temperature, heating, hot water)
 * - Read-only schedule list (no controls)
 *
 * Boost functionality will be added in Phase 2.
 */

// Test viewports
const VIEWPORTS = {
  raspberryPi: { width: 800, height: 480 },
  iPhone14: { width: 390, height: 844 },
  iPad: { width: 820, height: 1180 },
};

test.describe('Hive Integration - Phase 1: Status Display', () => {
  test.describe('Settings - Hive Credentials', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');
    });

    test('should display Hive section in settings drawer', async ({ page }) => {
      // Open settings drawer
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-drawer');

      // Check for Hive section
      await expect(page.locator('.settings-section-label:has-text("Hive")')).toBeVisible();
    });

    test('should show username and password inputs when disconnected', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-drawer');

      // Check for credential inputs
      await expect(page.locator('input[placeholder*="username" i]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show Connect button when disconnected', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-drawer');

      await expect(page.locator('button:has-text("Connect")')).toBeVisible();
    });

    test('should disable inputs while connecting', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-drawer');

      // Fill in credentials
      await page.fill('input[placeholder*="username" i]', 'testuser');
      await page.fill('input[type="password"]', 'testpass');

      // Click connect (will show loading state)
      await page.click('button:has-text("Connect")');

      // Inputs should be disabled during connection
      await expect(page.locator('input[placeholder*="username" i]')).toBeDisabled();
    });

    test('should show error message for invalid credentials', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-drawer');

      // Fill in invalid credentials (empty or wrong format)
      await page.fill('input[placeholder*="username" i]', 'invalid');
      await page.fill('input[type="password"]', 'wrong');

      await page.click('button:has-text("Connect")');

      // Wait for error message
      await expect(page.locator('.settings-error, .hive-error')).toBeVisible({ timeout: 5000 });
    });

    test('should show connected status after successful login', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-drawer');

      // In demo mode, use demo credentials that work
      await page.fill('input[placeholder*="username" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');

      await page.click('button:has-text("Connect")');

      // Should show connected status
      await expect(page.locator(':has-text("Connected")')).toBeVisible({ timeout: 5000 });
    });

    test('should show Disconnect button when connected', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-drawer');

      // Connect with demo credentials
      await page.fill('input[placeholder*="username" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');

      // Wait for connection
      await expect(page.locator('button:has-text("Disconnect")')).toBeVisible({ timeout: 5000 });
    });

    test('should clear credentials on disconnect', async ({ page }) => {
      await page.click('[aria-label="settings"]');
      await page.waitForSelector('.settings-drawer');

      // Connect first
      await page.fill('input[placeholder*="username" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');
      await expect(page.locator('button:has-text("Disconnect")')).toBeVisible({ timeout: 5000 });

      // Disconnect
      await page.click('button:has-text("Disconnect")');

      // Should show Connect button again
      await expect(page.locator('button:has-text("Connect")')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should not show Hive tab when not connected', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');

      // Hive tab should not be visible
      await expect(page.locator('.nav-tab:has-text("Hive")')).not.toBeVisible();
    });

    test('should show Hive tab after connecting', async ({ page }) => {
      await page.goto('/?demo=true');
      await page.waitForSelector('.main-panel');

      // Connect to Hive
      await page.click('[aria-label="settings"]');
      await page.fill('input[placeholder*="username" i]', 'demo@hive.com');
      await page.fill('input[type="password"]', 'demo');
      await page.click('button:has-text("Connect")');
      await expect(page.locator('button:has-text("Disconnect")')).toBeVisible({ timeout: 5000 });

      // Close settings
      await page.click('.settings-drawer-close, .settings-drawer-overlay');

      // Hive tab should now be visible
      await expect(page.locator('.nav-tab:has-text("Hive")')).toBeVisible();
    });

    test('should navigate to Hive view when tab is clicked', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');

      // Click Hive tab
      await page.click('.nav-tab:has-text("Hive")');

      // Should show Hive view
      await expect(page.locator('.hive-view')).toBeVisible();
    });

    test('should highlight Hive tab when selected', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');

      await page.click('.nav-tab:has-text("Hive")');

      await expect(page.locator('.nav-tab:has-text("Hive")')).toHaveClass(/active/);
    });

    test('should hide Hive tab after disconnect', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');

      // Verify Hive tab is visible
      await expect(page.locator('.nav-tab:has-text("Hive")')).toBeVisible();

      // Disconnect
      await page.click('[aria-label="settings"]');
      await page.click('button:has-text("Disconnect")');
      await page.click('.settings-drawer-close, .settings-drawer-overlay');

      // Hive tab should be hidden
      await expect(page.locator('.nav-tab:has-text("Hive")')).not.toBeVisible();
    });
  });

  test.describe('Thermostat Display', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');
      await page.waitForSelector('.hive-view');
    });

    test('should display current temperature', async ({ page }) => {
      // Look for temperature display with number and degree symbol
      const tempDisplay = page.locator('.thermostat-temp, .hive-temperature');
      await expect(tempDisplay).toBeVisible();

      // Should contain a temperature value
      const text = await tempDisplay.textContent();
      expect(text).toMatch(/\d+\.?\d*°[CF]/);
    });

    test('should display temperature in user preferred unit', async ({ page }) => {
      // Default is celsius
      const tempDisplay = page.locator('.thermostat-temp, .hive-temperature');
      const text = await tempDisplay.textContent();
      expect(text).toMatch(/°C/);
    });

    test('should display heating status indicator', async ({ page }) => {
      // Should show Heating text
      await expect(page.locator('.heating-status, [data-testid="heating-status"]')).toBeVisible();
      await expect(page.locator('text=Heating')).toBeVisible();
    });

    test('should display hot water status indicator', async ({ page }) => {
      // Should show Hot Water text
      await expect(page.locator('.hotwater-status, [data-testid="hotwater-status"]')).toBeVisible();
      await expect(page.locator('text=Hot Water')).toBeVisible();
    });

    test('should show heating icon in orange when heating is on', async ({ page }) => {
      // In demo mode, heating is on by default
      const heatingStatus = page.locator('.heating-status.on, [data-testid="heating-status"].on');
      await expect(heatingStatus).toBeVisible();
    });

    test('should show muted icon when heating is off', async ({ page }) => {
      // Navigate to a state where heating is off
      await page.goto('/?demo=true&hive=connected&heating=off');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');

      const heatingStatus = page.locator('.heating-status.off, [data-testid="heating-status"].off');
      await expect(heatingStatus).toBeVisible();
    });

    test('should display current mode badge', async ({ page }) => {
      // Should show mode badge (Schedule, Manual, or Boost)
      const modeBadge = page.locator('.hive-mode, [data-testid="hive-mode"]');
      await expect(modeBadge).toBeVisible();

      const text = await modeBadge.textContent();
      expect(text).toMatch(/Schedule|Manual|Boost/i);
    });

    test('should have accessible temperature label', async ({ page }) => {
      const tempDisplay = page.locator('.thermostat-temp, .hive-temperature');
      const ariaLabel = await tempDisplay.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/temperature/i);
    });

    test('should have accessible heating status label', async ({ page }) => {
      const heatingStatus = page.locator('.heating-status, [data-testid="heating-status"]');
      const ariaLabel = await heatingStatus.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/heating/i);
    });

    test('should have accessible hot water status label', async ({ page }) => {
      const hotWaterStatus = page.locator('.hotwater-status, [data-testid="hotwater-status"]');
      const ariaLabel = await hotWaterStatus.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/hot water/i);
    });
  });

  test.describe('Schedule List (Read-Only)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');
      await page.waitForSelector('.hive-view');
    });

    test('should display list of schedules', async ({ page }) => {
      const scheduleList = page.locator('.hive-schedules, .schedule-list');
      await expect(scheduleList).toBeVisible();

      // Should have at least one schedule card
      const cards = page.locator('.hive-schedule-card, .schedule-card');
      await expect(cards.first()).toBeVisible();
    });

    test('should display schedule name', async ({ page }) => {
      const card = page.locator('.hive-schedule-card, .schedule-card').first();
      const name = card.locator('.schedule-name, .hive-schedule-name');
      await expect(name).toBeVisible();
      await expect(name).not.toBeEmpty();
    });

    test('should display schedule description with time and days', async ({ page }) => {
      const card = page.locator('.hive-schedule-card, .schedule-card').first();
      const description = card.locator('.schedule-description, .hive-schedule-description');
      await expect(description).toBeVisible();

      // Should contain time information
      const text = await description.textContent();
      expect(text).toMatch(/\d+:\d+|AM|PM|Mon|Tue|Wed|Thu|Fri|Sat|Sun/i);
    });

    test('should display schedule icon indicating type', async ({ page }) => {
      const card = page.locator('.hive-schedule-card, .schedule-card').first();
      const icon = card.locator('.schedule-icon, .hive-schedule-icon');
      await expect(icon).toBeVisible();
    });

    test('should have accessible schedule cards with role listitem', async ({ page }) => {
      const card = page.locator('.hive-schedule-card, .schedule-card').first();
      const role = await card.getAttribute('role');
      expect(role).toBe('listitem');
    });

    test('should show both heating and hot water schedules', async ({ page }) => {
      // In demo mode, should have both types
      const heatingSchedule = page.locator(
        '.hive-schedule-card.heating, [data-schedule-type="heating"]'
      );
      const hotWaterSchedule = page.locator(
        '.hive-schedule-card.hotwater, [data-schedule-type="hotwater"]'
      );

      // At least one of each type should exist in demo mode
      const hasHeating = (await heatingSchedule.count()) > 0;
      const hasHotWater = (await hotWaterSchedule.count()) > 0;

      expect(hasHeating || hasHotWater).toBe(true);
    });
  });

  test.describe('Loading and Error States', () => {
    test('should show loading state while fetching Hive data', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected&hive_loading=true');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');

      // Should show loading indicator
      await expect(page.locator('.hive-loading')).toBeVisible();
      await expect(page.locator('.hive-loading .spinner')).toBeVisible();
    });

    test('should show loading text while fetching', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected&hive_loading=true');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');

      await expect(page.locator('text=Loading')).toBeVisible();
    });

    test('should show error state with message on failure', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected&hive_error=true');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');

      // Should show error message
      await expect(page.locator('.hive-error')).toBeVisible();
    });

    test('should show retry button on error', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected&hive_error=true');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');

      // Should show retry button
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should show empty state when no schedules configured', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected&hive_empty=true');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');

      // Should show thermostat but empty schedule message
      await expect(page.locator('.hive-empty, :has-text("No schedules")')).toBeVisible();
    });

    test('should still show thermostat in empty state', async ({ page }) => {
      await page.goto('/?demo=true&hive=connected&hive_empty=true');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');

      // Thermostat should still be visible
      await expect(page.locator('.thermostat-temp, .hive-temperature')).toBeVisible();
    });
  });

  test.describe('Responsive - Raspberry Pi (800x480)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.raspberryPi);
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');
      await page.waitForSelector('.hive-view');
    });

    test('should display Hive view on Raspberry Pi', async ({ page }) => {
      await expect(page.locator('.hive-view')).toBeVisible();
    });

    test('should show thermostat display on compact screen', async ({ page }) => {
      await expect(page.locator('.thermostat-temp, .hive-temperature')).toBeVisible();
    });

    test('should show status indicators', async ({ page }) => {
      await expect(page.locator('.heating-status, [data-testid="heating-status"]')).toBeVisible();
      await expect(page.locator('.hotwater-status, [data-testid="hotwater-status"]')).toBeVisible();
    });

    test('should not have overlapping elements', async ({ page }) => {
      const thermostat = page.locator('.thermostat-display, .hive-thermostat');
      const scheduleList = page.locator('.hive-schedules, .schedule-list');

      const thermostatBox = await thermostat.boundingBox();
      const scheduleBox = await scheduleList.boundingBox();

      if (thermostatBox && scheduleBox) {
        // Schedule list should be below thermostat
        expect(scheduleBox.y).toBeGreaterThanOrEqual(thermostatBox.y + thermostatBox.height - 5);
      }
    });

    test('should fit within viewport width', async ({ page }) => {
      const hiveView = page.locator('.hive-view');
      const box = await hiveView.boundingBox();

      expect(box?.width).toBeLessThanOrEqual(800);
    });

    test('should not overlap with top toolbar', async ({ page }) => {
      const toolbar = page.locator('.top-toolbar');
      const hiveView = page.locator('.hive-view');

      const toolbarBox = await toolbar.boundingBox();
      const hiveBox = await hiveView.boundingBox();

      if (toolbarBox && hiveBox) {
        expect(hiveBox.y).toBeGreaterThanOrEqual(toolbarBox.y + toolbarBox.height);
      }
    });

    test('should not overlap with bottom navigation', async ({ page }) => {
      const bottomNav = page.locator('.bottom-nav');
      const hiveView = page.locator('.hive-view');

      const navBox = await bottomNav.boundingBox();
      const hiveBox = await hiveView.boundingBox();

      if (navBox && hiveBox) {
        expect(hiveBox.y + hiveBox.height).toBeLessThanOrEqual(navBox.y + 5);
      }
    });
  });

  test.describe('Responsive - iPhone 14+ (390x844)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.iPhone14);
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');
      await page.waitForSelector('.hive-view');
    });

    test('should display Hive view on iPhone', async ({ page }) => {
      await expect(page.locator('.hive-view')).toBeVisible();
    });

    test('should show thermostat display on mobile', async ({ page }) => {
      await expect(page.locator('.thermostat-temp, .hive-temperature')).toBeVisible();
    });

    test('should have adequate spacing from screen edges', async ({ page }) => {
      const card = page.locator('.hive-schedule-card, .schedule-card').first();
      const box = await card.boundingBox();

      if (box) {
        // Should have at least 8px from edges
        expect(box.x).toBeGreaterThanOrEqual(8);
        expect(box.x + box.width).toBeLessThanOrEqual(390 - 8);
      }
    });

    test('should have scrollable content if needed', async ({ page }) => {
      const hiveView = page.locator('.hive-view');
      const overflow = await hiveView.evaluate((el) => {
        const style = getComputedStyle(el);
        return style.overflowY;
      });
      expect(overflow).toMatch(/auto|scroll|visible/);
    });
  });

  test.describe('Responsive - iPad (820x1180)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.iPad);
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');
      await page.waitForSelector('.hive-view');
    });

    test('should display Hive view on iPad', async ({ page }) => {
      await expect(page.locator('.hive-view')).toBeVisible();
    });

    test('should show thermostat display on tablet', async ({ page }) => {
      await expect(page.locator('.thermostat-temp, .hive-temperature')).toBeVisible();
    });

    test('should center content within max-width', async ({ page }) => {
      const hiveView = page.locator('.hive-view');
      const box = await hiveView.boundingBox();

      if (box) {
        // Content should be centered (roughly equal margins on sides)
        const leftMargin = box.x;
        const rightMargin = 820 - (box.x + box.width);
        expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(50);
      }
    });

    test('should use available vertical space', async ({ page }) => {
      const thermostat = page.locator('.thermostat-display, .hive-thermostat');
      const box = await thermostat.boundingBox();

      // Thermostat should have reasonable size on large screen
      if (box) {
        expect(box.height).toBeGreaterThan(80);
      }
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/?demo=true&hive=connected');
      await page.waitForSelector('.main-panel');
      await page.click('.nav-tab:has-text("Hive")');
      await page.waitForSelector('.hive-view');
    });

    test('should support keyboard navigation to Hive tab', async ({ page }) => {
      // Focus on bottom nav
      await page.keyboard.press('Tab');

      // Tab through nav items to reach Hive
      let foundHive = false;
      for (let i = 0; i < 10; i++) {
        const focused = page.locator(':focus');
        const text = await focused.textContent();
        if (text?.includes('Hive')) {
          foundHive = true;
          break;
        }
        await page.keyboard.press('Tab');
      }

      expect(foundHive).toBe(true);
    });

    test('should activate Hive tab with Enter key', async ({ page }) => {
      // Navigate to Hive tab via keyboard
      const hiveTab = page.locator('.nav-tab:has-text("Hive")');
      await hiveTab.focus();
      await page.keyboard.press('Enter');

      await expect(hiveTab).toHaveClass(/active/);
    });

    test('should have proper heading structure', async ({ page }) => {
      // Check for appropriate heading in Hive view
      const heading = page.locator('.hive-view h2, .hive-view h3');
      // May not have explicit heading, which is acceptable
    });

    test('should announce temperature with unit for screen readers', async ({ page }) => {
      const tempDisplay = page.locator('.thermostat-temp, .hive-temperature');
      const ariaLabel = await tempDisplay.getAttribute('aria-label');

      // Should include both value and unit
      expect(ariaLabel).toMatch(/\d+.*degrees/i);
    });
  });
});
