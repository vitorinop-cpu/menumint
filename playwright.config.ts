import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * E2E tests run against a production build in local demo mode with an isolated,
 * freshly-seeded data directory (.data-test). Tests share one JSON store, so they
 * run serially.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /responsive/ },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" }, testMatch: /responsive/ },
  ],
  webServer: {
    command: `rm -rf .data-test && npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      MENUMINT_DATA_DIR: ".data-test",
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      CLERK_SECRET_KEY: "",
      STRIPE_SECRET_KEY: "",
    },
  },
});
