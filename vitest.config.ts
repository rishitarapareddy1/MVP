import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Resolves the "@/..." import alias from tsconfig.json.
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
