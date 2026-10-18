import { defineConfig } from "vitest/config";

// Database access-rule suite: builds the real schema (migrations + seed) in an
// in-memory Postgres (PGlite) and checks who can read and write what.
// Never touches the live database. Run with `npm run test:db`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
