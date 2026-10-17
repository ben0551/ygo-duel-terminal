import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest is used for the pure domain logic in `src/lib`, which needs no DOM.
 * Keeping the environment as `node` makes the suite fast and dependency-light.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
