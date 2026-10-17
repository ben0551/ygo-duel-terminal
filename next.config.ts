import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** Repository name — GitHub project pages are served from /<repo>/. */
const REPO_NAME = "ygo-duel-terminal";

/**
 * GitHub Pages needs a static export: plain HTML/CSS/JS with no Node server.
 * `GITHUB_PAGES=1` switches the build into that mode, so the default local
 * `npm run dev` / `npm start` workflow is untouched.
 */
const isGithubPages = process.env.GITHUB_PAGES === "1";

/**
 * The build spawns one worker per CPU for page-data collection. Inside a
 * memory-capped container that can push past the cgroup limit and get the build
 * SIGKILLed, so `LOW_MEMORY_BUILD=1` forces a single worker.
 */
const lowMemoryBuild = process.env.LOW_MEMORY_BUILD === "1";

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

  // Server-only rendering features. They require a Node runtime, so they are
  // switched off for the static export.
  ...(isGithubPages
    ? {
        output: "export" as const,
        // Project pages live under a subpath, so assets must be prefixed too.
        basePath: `/${REPO_NAME}`,
        assetPrefix: `/${REPO_NAME}/`,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
      }),

  typescript: {
    /**
     * Type checking normally runs as part of `next build`. On memory-constrained
     * machines that step can be OOM-killed, so it can be skipped with
     * `NEXT_SKIP_TYPE_CHECK=1` — `npm run typecheck` runs `tsc --noEmit`
     * separately, so nothing goes unchecked.
     */
    ignoreBuildErrors: process.env.NEXT_SKIP_TYPE_CHECK === "1",
  },

  ...(lowMemoryBuild ? { experimental: { cpus: 1 } } : {}),
};

export default nextConfig;
