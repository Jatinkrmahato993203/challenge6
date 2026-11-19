import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3101";
const chromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL, browserName: "chromium", launchOptions: { executablePath: chromium }, trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --port 3101",
    url: `${baseURL}/api/health`,
    env: { LIVE_FORECAST_ENABLED: "false", DEMO_DATA_MODE: "true", AI_EXPLAIN_ENABLED: "false",
      SAANSAI_SIGNING_SECRET: "offline-playwright-test-only-signing-key", RATE_LIMIT_PER_MINUTE: "100" },
    reuseExistingServer: false,
    timeout: 30_000,
  },
  workers: 1,
});
