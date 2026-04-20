import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOnce } from "./useOnce";

describe("useOnce", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns shouldShow=true on first visit", () => {
    const { result } = renderHook(() => useOnce("test-key"));
    expect(result.current.shouldShow).toBe(true);
  });

  it("returns shouldShow=false after dismiss is called", () => {
    const { result } = renderHook(() => useOnce("test-key"));
    act(() => result.current.dismiss());
    expect(result.current.shouldShow).toBe(false);
  });

  it("persists dismissal across hook remounts (same key)", () => {
    const first = renderHook(() => useOnce("persist-key"));
    act(() => first.result.current.dismiss());
    first.unmount();

    const second = renderHook(() => useOnce("persist-key"));
    expect(second.result.current.shouldShow).toBe(false);
  });

  it("different keys are tracked independently", () => {
    const a = renderHook(() => useOnce("key-a"));
    act(() => a.result.current.dismiss());

    const b = renderHook(() => useOnce("key-b"));
    expect(b.result.current.shouldShow).toBe(true);
  });
});
