import { describe, it, expect } from "vitest";
import { getFirstSelectedSlot } from "./getFirstSelectedSlot";
import type { CellGridModel } from "./slotsToCells";

function makeGrid(entries: [string, string][]): CellGridModel {
  return {
    dates: [...new Set(entries.map(([k]) => k.split("_")[0]!))].sort(),
    times: [...new Set(entries.map(([k]) => k.split("_")[1]!))].sort(),
    availableCells: new Set(entries.map(([k]) => k)),
    slotIdByCell: new Map(entries),
  };
}

describe("getFirstSelectedSlot", () => {
  it("returns null when nothing is selected", () => {
    const grid = makeGrid([["2025-05-12_09:00", "uuid-a"]]);
    expect(getFirstSelectedSlot(grid, new Set())).toBeNull();
  });

  it("returns null when selected ids are not in the grid", () => {
    const grid = makeGrid([["2025-05-12_09:00", "uuid-a"]]);
    expect(getFirstSelectedSlot(grid, new Set(["uuid-z"]))).toBeNull();
  });

  it("returns the earliest cellKey by lexicographic sort (date then time)", () => {
    const grid = makeGrid([
      ["2025-05-12_10:00", "uuid-b"],
      ["2025-05-12_09:00", "uuid-a"],
      ["2025-05-13_09:00", "uuid-c"],
    ]);
    const result = getFirstSelectedSlot(grid, new Set(["uuid-b", "uuid-c"]));
    expect(result?.date).toBe("2025-05-12");
    expect(result?.time).toBe("10:00");
    expect(result?.remaining).toBe(1);
  });

  it("returns remaining=0 when only one slot is selected", () => {
    const grid = makeGrid([["2025-05-12_09:00", "uuid-a"]]);
    const result = getFirstSelectedSlot(grid, new Set(["uuid-a"]));
    expect(result?.remaining).toBe(0);
  });
});
