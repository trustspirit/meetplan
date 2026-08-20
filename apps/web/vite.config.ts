import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const publicOrigin = loadEnv(mode, rootDir, "VITE_").VITE_PUBLIC_ORIGIN ?? "";

  return {
    plugins: [
      react(),
      {
        // og:image는 절대 URL을 요구하는 크롤러가 많다(Slack·KakaoTalk). 배포 도메인은
        // 빌드 시점 .env 파일/쉘 변수로만 알 수 있으므로 loadEnv로 직접 읽어 주입한다.
        // 미설정(빈 문자열)이면 "/og.png" 상대 경로로 폴백 (앱은 정상, 썸네일만 빠짐).
        name: "og-origin",
        transformIndexHtml: (html: string) => html.replaceAll("%VITE_PUBLIC_ORIGIN%", publicOrigin),
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
  };
});
