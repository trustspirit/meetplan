import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom에는 matchMedia가 없다. useMediaQuery를 쓰는 컴포넌트가 모바일 분기를
// 타도록 항상 false를 돌려준다 (반응형 분기는 컴포넌트 내부 책임).
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(),
  }),
});
