// @ts-check
const { defineConfig } = require('@playwright/test');
const path = require('path');

require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 120_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: 'http://localhost:3002',
    viewport: { width: 1440, height: 900 },
    locale: 'es-PE',
    screenshot: 'off',           // Manejamos screenshots manualmente
    trace: 'on-first-retry',
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },

  webServer: {
    command: 'node ../server.js',
    port: 3002,
    cwd: path.resolve(__dirname, '..'),
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
