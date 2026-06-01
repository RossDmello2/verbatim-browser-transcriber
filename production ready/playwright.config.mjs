import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: 'tests/web',
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    use: {
        baseURL: 'http://127.0.0.1:8080',
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'python -m http.server 8080',
        url: 'http://127.0.0.1:8080',
        reuseExistingServer: !process.env.CI,
        timeout: 15000
    }
});
