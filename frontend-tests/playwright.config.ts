import { defineConfig, devices } from '@playwright/test';

/**
 * Production Smoke Test Configuration
 *
 * These tests run against a LIVE production server (not mocked).
 * Target environment: Raspberry Pi 7" touchscreen (800x480)
 *
 * Usage:
 *   PROD_URL=http://192.168.1.50:3001 npm test
 *   npm test -- --url=http://localhost:3001
 */

// Get production URL from environment or default to localhost
const PROD_URL = process.env.PROD_URL || 'http://localhost:3001';

export default defineConfig({
  testDir: './tests',

  // Run tests serially - state depends on previous tests
  fullyParallel: false,

  // No retries for production smoke tests
  retries: 0,

  // Single worker for interactive tests
  workers: 1,

  // Reporter
  reporter: [['html', { outputFolder: 'test-results' }], ['list']],

  // Longer timeout for production tests with real hardware
  timeout: 60000,

  // Expect timeout - longer for real network latency
  expect: {
    timeout: 10000,
  },

  use: {
    // Target production server
    baseURL: PROD_URL,

    // Default viewport: Raspberry Pi 7" touchscreen
    viewport: { width: 800, height: 480 },

    // Headed mode for interactive tests (user needs to see what's happening)
    headless: false,

    // Longer timeouts for real hardware/network
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Capture screenshots on failure
    screenshot: 'only-on-failure',

    // Trace on failure for debugging
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'raspberry-pi',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 800, height: 480 },
      },
    },
  ],

  // No webServer - we connect to external production server
});
