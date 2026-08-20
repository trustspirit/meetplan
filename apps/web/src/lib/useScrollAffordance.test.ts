import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createRef } from "react";
import { useScrollAffordance } from "./useScrollAffordance";

/** jsdom은 레이아웃을 계산하지 않으므로 스크롤 관련 속성을 직접 정의한다. */
function makeEl(props: {
  scrollLeft?: number; clientWidth?: number; scrollWidth?: number;
  scrollTop?: number; clientHeight?: number; scrollHeight?: number;
}): HTMLElement {
  const el = document.createElement("div");
  const defs = {
    scrollLeft: props.scrollLeft ?? 0,
    clientWidth: props.clientWidth ?? 0,
    scrollWidth: props.scrollWidth ?? 0,
    scrollTop: props.scrollTop ?? 0,
    clientHeight: props.clientHeight ?? 0,
    scrollHeight: props.scrollHeight ?? 0,
  };
  for (const [k, v] of Object.entries(defs)) {
    Object.defineProperty(el, k, { value: v, configurable: true, writable: true });
  }
  return el;
}

beforeEach(() => {
  // jsdom에는 ResizeObserver가 없다.
  global.ResizeObserver = class {
    observe() {} unobserve() {} disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("useScrollAffordance", () => {
  it("스크롤 여지가 없으면 모두 false", () => {
    const ref = createRef<HTMLElement>();
    (ref as { current: HTMLElement }).current = makeEl({ clientWidth: 100, scrollWidth: 100 });
    const { result } = renderHook(() => useScrollAffordance(ref));
    expect(result.current).toEqual({
      canScrollUp: false, canScrollDown: false, canScrollLeft: false, canScrollRight: false,
    });
  });

  it("왼쪽 끝에서는 오른쪽으로만 갈 수 있다", () => {
    const ref = createRef<HTMLElement>();
    (ref as { current: HTMLElement }).current = makeEl({ scrollLeft: 0, clientWidth: 100, scrollWidth: 300 });
    const { result } = renderHook(() => useScrollAffordance(ref));
    expect(result.current.canScrollLeft).toBe(false);
    expect(result.current.canScrollRight).toBe(true);
  });

  it("가운데에서는 양쪽 모두 갈 수 있다", () => {
    const ref = createRef<HTMLElement>();
    (ref as { current: HTMLElement }).current = makeEl({ scrollLeft: 100, clientWidth: 100, scrollWidth: 300 });
    const { result } = renderHook(() => useScrollAffordance(ref));
    expect(result.current.canScrollLeft).toBe(true);
    expect(result.current.canScrollRight).toBe(true);
  });

  it("오른쪽 끝에서는 왼쪽으로만 갈 수 있다", () => {
    const ref = createRef<HTMLElement>();
    (ref as { current: HTMLElement }).current = makeEl({ scrollLeft: 200, clientWidth: 100, scrollWidth: 300 });
    const { result } = renderHook(() => useScrollAffordance(ref));
    expect(result.current.canScrollLeft).toBe(true);
    expect(result.current.canScrollRight).toBe(false);
  });

  it("세로 방향도 같은 규칙으로 판정한다", () => {
    const ref = createRef<HTMLElement>();
    (ref as { current: HTMLElement }).current = makeEl({ scrollTop: 50, clientHeight: 100, scrollHeight: 400 });
    const { result } = renderHook(() => useScrollAffordance(ref));
    expect(result.current.canScrollUp).toBe(true);
    expect(result.current.canScrollDown).toBe(true);
  });

  it("scroll 이벤트가 오면 상태를 갱신한다", () => {
    const ref = createRef<HTMLElement>();
    const el = makeEl({ scrollLeft: 0, clientWidth: 100, scrollWidth: 300 });
    (ref as { current: HTMLElement }).current = el;
    const { result } = renderHook(() => useScrollAffordance(ref));
    expect(result.current.canScrollLeft).toBe(false);

    act(() => {
      Object.defineProperty(el, "scrollLeft", { value: 200, configurable: true });
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.canScrollLeft).toBe(true);
    expect(result.current.canScrollRight).toBe(false);
  });
});
