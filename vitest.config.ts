import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Unit tests (fast, no database). The database access-rule suite has its own
// config (vitest.db.config.ts) and the browser tests use Playwright (e2e/).
export default defineConfig({
  // Resolves the "@/..." import alias from tsconfig.json.
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts", "components/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
