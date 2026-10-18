import { defineConfig, devices } from "@playwright/test";

// Load .env.local (Supabase keys for the logged-in tests). Node 20.12+ has
// process.loadEnvFile; it throws if the file is missing, which is fine to skip.
try {
  process.loadEnvFile(".env.local");
} catch {}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * Browser smoke tests: `npm run test:e2e`. Runs against the local dev server
 * (started automatically if it isn't running), or any deployment via
 * E2E_BASE_URL=https://... npm run test:e2e
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  // One at a time: generating a login code for an account cancels any
  // earlier code, so parallel logins as the same user would collide.
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: baseURL.startsWith("http://localhost")
    ? { command: "npm run dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 }
    : undefined,
});
