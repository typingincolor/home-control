/**
 * Layout assertion helpers for visual/layout testing
 *
 * These functions verify:
 * - No overlapping elements
 * - No cutoffs (elements within viewport)
 * - Minimum edge spacing
 * - Proper centering
 * - Button size constraints
 * - Grid layout correctness
 */

import { Page, expect } from '@playwright/test';
import { LAYOUT } from './constants';

/**
 * Get bounding box of an element, throwing if not found
 */
async function getBoundingBox(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  const box = await element.boundingBox();
  expect(box, `Element ${selector} should have bounding box`).not.toBeNull();
  return box!;
}

/**
 * Assert that two elements do not overlap
 */
export async function assertNoOverlap(
  page: Page,
  selector1: string,
  selector2: string
): Promise<void> {
  const box1 = await getBoundingBox(page, selector1);
  const box2 = await getBoundingBox(page, selector2);

  // Check horizontal overlap
  const horizontalOverlap =
    box1.x < box2.x + box2.width && box1.x + box1.width > box2.x;

  // Check vertical overlap
  const verticalOverlap =
    box1.y < box2.y + box2.height && box1.y + box1.height > box2.y;

  // Elements overlap if both horizontal AND vertical overlap
  const overlaps = horizontalOverlap && verticalOverlap;

  expect(
    overlaps,
    `Elements ${selector1} and ${selector2} should not overlap`
  ).toBe(false);
}

/**
 * Assert element has minimum spacing from screen edges
 */
export async function assertMinEdgeSpacing(
  page: Page,
  selector: string,
  minSpacing: number = LAYOUT.MIN_EDGE_SPACING
): Promise<void> {
  const box = await getBoundingBox(page, selector);
  const viewport = page.viewportSize();
  expect(viewport, 'Viewport should be defined').not.toBeNull();

  // Check left edge
  expect(
    box.x,
    `${selector} should have at least ${minSpacing}px from left edge`
  ).toBeGreaterThanOrEqual(minSpacing);

  // Check right edge
  const rightGap = viewport!.width - (box.x + box.width);
  expect(
    rightGap,
    `${selector} should have at least ${minSpacing}px from right edge`
  ).toBeGreaterThanOrEqual(minSpacing);
}

/**
 * Assert element is fully within viewport (no cutoffs)
 */
export async function assertWithinViewport(
  page: Page,
  selector: string
): Promise<void> {
  const box = await getBoundingBox(page, selector);
  const viewport = page.viewportSize();
  expect(viewport, 'Viewport should be defined').not.toBeNull();

  // Check horizontal bounds
  expect(box.x, `${selector} should not extend past left edge`).toBeGreaterThanOrEqual(0);
  expect(
    box.x + box.width,
    `${selector} should not extend past right edge`
  ).toBeLessThanOrEqual(viewport!.width);

  // Check vertical bounds
  expect(box.y, `${selector} should not extend past top edge`).toBeGreaterThanOrEqual(0);
  expect(
    box.y + box.height,
    `${selector} should not extend past bottom edge`
  ).toBeLessThanOrEqual(viewport!.height);
}

/**
 * Assert buttons are square and meet minimum size
 */
export async function assertSquareButtons(
  page: Page,
  selector: string,
  minSize: number = LAYOUT.MIN_BUTTON_SIZE
): Promise<void> {
  const elements = page.locator(selector);
  const count = await elements.count();
  expect(count, `Should have at least one ${selector}`).toBeGreaterThan(0);

  // Check first few elements
  const checkCount = Math.min(4, count);
  for (let i = 0; i < checkCount; i++) {
    const box = await elements.nth(i).boundingBox();
    expect(box, `${selector}[${i}] should have bounding box`).not.toBeNull();

    if (box) {
      // Check minimum size
      expect(
        box.width,
        `${selector}[${i}] width should be at least ${minSize}px`
      ).toBeGreaterThanOrEqual(minSize);
      expect(
        box.height,
        `${selector}[${i}] height should be at least ${minSize}px`
      ).toBeGreaterThanOrEqual(minSize);

      // Check square aspect ratio (within 5%)
      const aspectRatio = box.width / box.height;
      expect(
        aspectRatio,
        `${selector}[${i}] should be approximately square`
      ).toBeGreaterThan(0.95);
      expect(
        aspectRatio,
        `${selector}[${i}] should be approximately square`
      ).toBeLessThan(1.05);
    }
  }
}

/**
 * Assert grid has expected number of columns
 */
export async function assertGridColumns(
  page: Page,
  gridSelector: string,
  expectedColumns: number
): Promise<void> {
  const grid = page.locator(gridSelector);
  await expect(grid).toBeVisible();

  const columns = await grid.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.gridTemplateColumns.split(' ').length;
  });

  expect(
    columns,
    `Grid should have ${expectedColumns} columns`
  ).toBe(expectedColumns);
}

/**
 * Assert grid has expected number of visible rows
 */
export async function assertGridRows(
  page: Page,
  itemSelector: string,
  expectedRows: number,
  expectedColumns: number
): Promise<void> {
  const items = page.locator(itemSelector);
  const count = await items.count();
  const expectedItems = expectedRows * expectedColumns;

  expect(
    count,
    `Should have at least ${expectedItems} items for ${expectedRows}x${expectedColumns} grid`
  ).toBeGreaterThanOrEqual(expectedItems);

  // Get unique Y positions to count actual rows
  const yPositions = new Set<number>();
  for (let i = 0; i < Math.min(count, expectedItems); i++) {
    const box = await items.nth(i).boundingBox();
    if (box) {
      yPositions.add(Math.round(box.y));
    }
  }

  expect(
    yPositions.size,
    `Grid should have ${expectedRows} rows`
  ).toBe(expectedRows);
}

/**
 * Assert content is vertically centered between toolbar and nav
 */
export async function assertVerticalCentering(
  page: Page,
  topSelector: string,
  bottomSelector: string,
  contentSelector: string,
  tolerance: number = LAYOUT.SPACING_TOLERANCE
): Promise<void> {
  const topBox = await getBoundingBox(page, topSelector);
  const bottomBox = await getBoundingBox(page, bottomSelector);
  const contentBox = await getBoundingBox(page, contentSelector);

  const topSpacing = contentBox.y - (topBox.y + topBox.height);
  const bottomSpacing = bottomBox.y - (contentBox.y + contentBox.height);

  const difference = Math.abs(topSpacing - bottomSpacing);
  expect(
    difference,
    `Content should be vertically centered (top: ${topSpacing}px, bottom: ${bottomSpacing}px)`
  ).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert toolbar and nav don't overlap with main content
 */
export async function assertToolbarNavSeparation(page: Page): Promise<void> {
  const toolbar = page.locator('.top-toolbar');
  const nav = page.locator('.bottom-nav');
  const main = page.locator('.main-panel');

  // Only check if all elements exist
  if (
    (await toolbar.count()) > 0 &&
    (await nav.count()) > 0 &&
    (await main.count()) > 0
  ) {
    await assertNoOverlap(page, '.top-toolbar', '.main-panel');
    await assertNoOverlap(page, '.main-panel', '.bottom-nav');
  }
}

/**
 * Assert no elements are cut off (simplified check for key elements)
 */
export async function assertNoCutoffs(
  page: Page,
  selectors: string[]
): Promise<void> {
  for (const selector of selectors) {
    const elements = page.locator(selector);
    const count = await elements.count();

    if (count > 0) {
      await assertWithinViewport(page, selector);
    }
  }
}
