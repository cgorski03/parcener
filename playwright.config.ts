import { defineConfig, devices } from '@playwright/test';

const baseUrl = 'http://localhost:3000';
process.env.VITE_BASE_URL = baseUrl;

export default defineConfig({
    testDir: './src',
    testMatch: '**/*.e2e.ts',
    globalSetup: './src/test/e2e/global-setup.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: baseUrl,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'pnpm dev:test',
        url: baseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
