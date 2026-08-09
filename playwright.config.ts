/**
 * Playwright E2E Test Configuration for Tensho Mahjong Roguelike
 *
 * End-to-end browser testing configuration.
 * Tests run against a local dev server.
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [['html', { open: 'never' }], ['list']],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: 'http://127.0.0.1:4173',

    // Collect trace when retrying a failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile viewport tests
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Run local dev server before starting the tests
  // NOTE: If webServer doesn't work, run `bun run dev` manually first
  webServer: process.env.SKIP_WEB_SERVER
    ? undefined
    : {
        command:
          './node_modules/.bin/vite --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: false,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
