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

// jsdom에는 ResizeObserver도 없다. ScrollArea(useScrollAffordance)가 마운트 시
// 이를 구독하므로, 아무 것도 관찰하지 않는 스텁을 전역에 심어 둔다.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

// Node 22+의 실험적 전역 localStorage/sessionStorage가 jsdom 것을 가리고,
// --localstorage-file 없이는 undefined가 된다. jsdom의 스토리지로 되돌린다.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
if (jsdomWindow) {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, name, { configurable: true, value: jsdomWindow[name] });
  }
}
