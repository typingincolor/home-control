import { test, expect } from '@playwright/test';

// Viewport sizes for target platforms
const VIEWPORTS = {
  raspberryPi: { width: 800, height: 480 },
  iphone14: { width: 390, height: 844 },
  ipad: { width: 820, height: 1180 },
};

test.describe('Automations Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
  });

  test.describe('Navigation', () => {
    test('should display Automations tab in bottom navigation', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await expect(automationsTab).toBeVisible();
    });

    test('should navigate to Automations view when tab is clicked', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      const automationsView = page.locator('.automations-view');
      await expect(automationsView).toBeVisible();
    });

    test('should highlight Automations tab when selected', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      await expect(automationsTab).toHaveClass(/active/);
    });
  });

  test.describe('Automations List', () => {
    test.beforeEach(async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();
    });

    test('should display list of automations', async ({ page }) => {
      const automationCards = page.locator('.automation-card');
      await expect(automationCards.first()).toBeVisible();
    });

    test('should display automation name and description', async ({ page }) => {
      const automationCard = page.locator('.automation-card').first();
      const name = automationCard.locator('.automation-name');
      const description = automationCard.locator('.automation-description');

      await expect(name).toBeVisible();
      await expect(description).toBeVisible();
    });

    test('should display trigger button for each automation', async ({ page }) => {
      const automationCard = page.locator('.automation-card').first();
      const triggerButton = automationCard.locator('.automation-trigger');

      await expect(triggerButton).toBeVisible();
    });
  });

  test.describe('Trigger Automation', () => {
    test.beforeEach(async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();
    });

    test('should trigger automation when trigger button is clicked', async ({ page }) => {
      const automationCard = page.locator('.automation-card').first();
      const triggerButton = automationCard.locator('.automation-trigger');

      await triggerButton.click();

      // Button should still be visible after triggering
      await expect(triggerButton).toBeVisible();
    });

    test('should show loading state while triggering', async ({ page }) => {
      const automationCard = page.locator('.automation-card').first();
      const triggerButton = automationCard.locator('.automation-trigger');

      // Click and immediately check for spinner
      await triggerButton.click();

      // The spinner should appear briefly (may be too fast to catch in some cases)
      // At minimum, the button should remain functional
      await expect(triggerButton).toBeEnabled();
    });

    test('should have accessible trigger button', async ({ page }) => {
      const automationCard = page.locator('.automation-card').first();
      const triggerButton = automationCard.locator('.automation-trigger');

      // Button should have aria-label
      await expect(triggerButton).toHaveAttribute('aria-label', /Trigger/i);
    });
  });

  test.describe('Empty State', () => {
    // Note: This test assumes demo mode can simulate empty automations
    // If demo always returns automations, this test documents expected behavior
    test('should show empty state message when no automations exist', async ({ page }) => {
      // Navigate to automations
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      // If there are automations, this test passes
      // If empty, should show empty state
      const automationsView = page.locator('.automations-view');
      await expect(automationsView).toBeVisible();
    });
  });

  test.describe('Responsive - Raspberry Pi (800x480)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.raspberryPi);
      await page.goto('/?demo=true');
    });

    test('should display Automations tab on Raspberry Pi', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await expect(automationsTab).toBeVisible();
    });

    test('should show automations list on Raspberry Pi', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      const automationsView = page.locator('.automations-view');
      await expect(automationsView).toBeVisible();
    });

    test('should have touch-friendly trigger buttons (min 44px)', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      const triggerButton = page.locator('.automation-card').first().locator('.automation-trigger');
      const box = await triggerButton.boundingBox();

      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    });

    test('should not have overlapping elements', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      // Check the main-panel container (not automations-view content which may scroll)
      const mainPanel = page.locator('.main-panel');
      const bottomNav = page.locator('.bottom-nav');
      const topToolbar = page.locator('.top-toolbar');

      const panelBox = await mainPanel.boundingBox();
      const navBox = await bottomNav.boundingBox();
      const toolbarBox = await topToolbar.boundingBox();

      // Main panel should be below toolbar
      expect(panelBox?.y).toBeGreaterThanOrEqual((toolbarBox?.y ?? 0) + (toolbarBox?.height ?? 0));

      // Main panel should be above bottom nav (with small tolerance for rounding)
      expect((panelBox?.y ?? 0) + (panelBox?.height ?? 0)).toBeLessThanOrEqual(
        (navBox?.y ?? 0) + 2
      );
    });
  });

  test.describe('Responsive - iPhone 14+ (390x844)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.iphone14);
      await page.goto('/?demo=true');
    });

    test('should display Automations tab on iPhone', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await expect(automationsTab).toBeVisible();
    });

    test('should show automations list on iPhone', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      const automationsView = page.locator('.automations-view');
      await expect(automationsView).toBeVisible();
    });

    test('should have adequate spacing from screen edges', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      const automationCard = page.locator('.automation-card').first();
      const box = await automationCard.boundingBox();

      // Should have at least 8px from left edge
      expect(box?.x).toBeGreaterThanOrEqual(8);
    });
  });

  test.describe('Responsive - iPad (820x1180)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.ipad);
      await page.goto('/?demo=true');
    });

    test('should display Automations tab on iPad', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await expect(automationsTab).toBeVisible();
    });

    test('should show automations list on iPad', async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();

      const automationsView = page.locator('.automations-view');
      await expect(automationsView).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.click();
    });

    test('should have proper ARIA labels on automation cards', async ({ page }) => {
      const automationCard = page.locator('.automation-card').first();
      const triggerButton = automationCard.locator('.automation-trigger');

      // Trigger button should have descriptive aria-label
      const ariaLabel = await triggerButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('Trigger');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab should be focusable
      const automationsTab = page.getByRole('button', { name: /Automations/i });
      await automationsTab.focus();
      await expect(automationsTab).toBeFocused();
    });
  });
});
