import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": `${rootDir}src`,
      "@meetplan/shared": `${rootDir}../../packages/shared/src/index.ts`,
    },
    conditions: ["import", "module", "browser", "default"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    exclude: ["node_modules", "dist", "tests/e2e/**"],
  },
});
