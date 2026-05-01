import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@meetplan/shared": `${rootDir}packages/shared/src/index.ts`,
    },
  },
  test: { globals: true, environment: "node" },
});
