import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /**
   * Pinned explicitly so Turbopack does not walk up and pick a lockfile from a
   * parent directory when the project is nested inside another workspace.
   */
  turbopack: {
    root: projectRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  typescript: {
    /**
     * Type checking normally runs as part of `next build`. On memory-constrained
     * machines that step can be OOM-killed, so it can be skipped with
     * `NEXT_SKIP_TYPE_CHECK=1` — `npm run typecheck` runs `tsc --noEmit`
     * separately, so nothing goes unchecked.
     */
    ignoreBuildErrors: process.env.NEXT_SKIP_TYPE_CHECK === "1",
  },
};

export default nextConfig;
