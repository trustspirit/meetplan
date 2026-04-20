import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useEventCreateState } from "./useEventCreateState";

describe("useEventCreateState", () => {
  it("initializes with defaults", () => {
    const { result } = renderHook(() => useEventCreateState());
    expect(result.current.state.periodMinutes).toBe(30);
    expect(result.current.state.title).toBe("");
    expect(result.current.state.selectedDates).toEqual([]);
    expect(result.current.state.paintedCells).toEqual(new Set());
  });

  it("adds and removes dates", () => {
    const { result } = renderHook(() => useEventCreateState());
    act(() => result.current.toggleDate("2026-04-22"));
    expect(result.current.state.selectedDates).toEqual(["2026-04-22"]);
    act(() => result.current.toggleDate("2026-04-22"));
    expect(result.current.state.selectedDates).toEqual([]);
  });

  it("keeps dates sorted on add", () => {
    const { result } = renderHook(() => useEventCreateState());
    act(() => result.current.toggleDate("2026-04-24"));
    act(() => result.current.toggleDate("2026-04-22"));
    act(() => result.current.toggleDate("2026-04-23"));
    expect(result.current.state.selectedDates).toEqual(["2026-04-22", "2026-04-23", "2026-04-24"]);
  });

  it("paints and unpaints cells", () => {
    const { result } = renderHook(() => useEventCreateState());
    act(() => result.current.setCellPainted("2026-04-22_14:00", true));
    expect(result.current.state.paintedCells.has("2026-04-22_14:00")).toBe(true);
    act(() => result.current.setCellPainted("2026-04-22_14:00", false));
    expect(result.current.state.paintedCells.has("2026-04-22_14:00")).toBe(false);
  });

  it("removes painted cells when a date is deselected", () => {
    const { result } = renderHook(() => useEventCreateState());
    act(() => result.current.toggleDate("2026-04-22"));
    act(() => result.current.setCellPainted("2026-04-22_14:00", true));
    act(() => result.current.toggleDate("2026-04-22"));
    expect(result.current.state.paintedCells.has("2026-04-22_14:00")).toBe(false);
  });
});
