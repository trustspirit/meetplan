import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      // og:image는 절대 URL을 요구하는 크롤러가 많다(Slack·KakaoTalk). 배포 도메인은
      // 빌드 시점 환경변수로만 알 수 있으므로 여기서 주입한다.
      // 미설정 시 빈 문자열 → "/og.png" 상대 경로로 폴백 (앱은 정상, 썸네일만 빠짐).
      name: "og-origin",
      transformIndexHtml: (html: string) =>
        html.replaceAll("%VITE_PUBLIC_ORIGIN%", process.env.VITE_PUBLIC_ORIGIN ?? ""),
    },
  ],
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
