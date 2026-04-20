import { describe, it, expect } from "vitest";
import type { Slot } from "@meetplan/shared";
import { slotsToPaintedCells } from "./slotsToPaintedCells";

const tz = "Asia/Seoul";

describe("slotsToPaintedCells", () => {
  it("returns empty state for empty slots", () => {
    const out = slotsToPaintedCells([], 30, tz);
    expect(out.selectedDates).toEqual([]);
    expect(out.paintedCells.size).toBe(0);
    expect(out.dailyRange).toEqual(["09:00", "18:00"]);
  });

  it("extracts date in viewer TZ and marks cell painted", () => {
    const slots: Slot[] = [
      { id: "s_1", start: "2026-04-22T05:00:00.000Z", end: "2026-04-22T05:30:00.000Z" },
    ];
    const out = slotsToPaintedCells(slots, 30, tz);
    expect(out.selectedDates).toEqual(["2026-04-22"]);
    expect(out.paintedCells.has("2026-04-22_14:00")).toBe(true);
  });

  it("produces sorted unique dates across slots", () => {
    const slots: Slot[] = [
      { id: "s_3", start: "2026-04-24T05:00:00.000Z", end: "2026-04-24T05:30:00.000Z" },
      { id: "s_1", start: "2026-04-22T05:00:00.000Z", end: "2026-04-22T05:30:00.000Z" },
      { id: "s_2", start: "2026-04-23T05:00:00.000Z", end: "2026-04-23T05:30:00.000Z" },
    ];
    const out = slotsToPaintedCells(slots, 30, tz);
    expect(out.selectedDates).toEqual(["2026-04-22", "2026-04-23", "2026-04-24"]);
  });

  it("derives dailyRange from earliest start and latest end (viewer TZ)", () => {
    const slots: Slot[] = [
      // 10:00-10:30 (Seoul)
      { id: "s_1", start: "2026-04-22T01:00:00.000Z", end: "2026-04-22T01:30:00.000Z" },
      // 16:30-17:00 (Seoul)
      { id: "s_2", start: "2026-04-22T07:30:00.000Z", end: "2026-04-22T08:00:00.000Z" },
    ];
    const out = slotsToPaintedCells(slots, 30, tz);
    expect(out.dailyRange).toEqual(["10:00", "17:00"]);
  });

  it("multiple cells on same date", () => {
    const slots: Slot[] = [
      { id: "s_1", start: "2026-04-22T05:00:00.000Z", end: "2026-04-22T05:30:00.000Z" },
      { id: "s_2", start: "2026-04-22T05:30:00.000Z", end: "2026-04-22T06:00:00.000Z" },
      { id: "s_3", start: "2026-04-22T06:00:00.000Z", end: "2026-04-22T06:30:00.000Z" },
    ];
    const out = slotsToPaintedCells(slots, 30, tz);
    expect(out.paintedCells.size).toBe(3);
    expect(out.paintedCells.has("2026-04-22_14:00")).toBe(true);
    expect(out.paintedCells.has("2026-04-22_14:30")).toBe(true);
    expect(out.paintedCells.has("2026-04-22_15:00")).toBe(true);
  });
});
