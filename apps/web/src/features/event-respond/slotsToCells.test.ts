import { describe, it, expect } from "vitest";
import { slotsToCells } from "./slotsToCells";

const slots = [
  { id: "s_2026-04-22T05:00:00.000Z", start: "2026-04-22T05:00:00.000Z", end: "2026-04-22T05:30:00.000Z" },
  { id: "s_2026-04-22T05:30:00.000Z", start: "2026-04-22T05:30:00.000Z", end: "2026-04-22T06:00:00.000Z" },
  { id: "s_2026-04-23T06:00:00.000Z", start: "2026-04-23T06:00:00.000Z", end: "2026-04-23T06:30:00.000Z" },
];

describe("slotsToCells (Asia/Seoul viewer)", () => {
  const tz = "Asia/Seoul";

  it("extracts sorted unique dates in viewer TZ", () => {
    const out = slotsToCells(slots, tz);
    expect(out.dates).toEqual(["2026-04-22", "2026-04-23"]);
  });

  it("extracts sorted unique times in viewer TZ", () => {
    const out = slotsToCells(slots, tz);
    expect(out.times).toEqual(["14:00", "14:30", "15:00"]);
  });

  it("marks cells that have a host slot as available", () => {
    const out = slotsToCells(slots, tz);
    expect(out.availableCells.has("2026-04-22_14:00")).toBe(true);
    expect(out.availableCells.has("2026-04-22_14:30")).toBe(true);
    expect(out.availableCells.has("2026-04-23_15:00")).toBe(true);
  });

  it("leaves empty cells (no host slot) unavailable", () => {
    const out = slotsToCells(slots, tz);
    expect(out.availableCells.has("2026-04-23_14:00")).toBe(false);
    expect(out.availableCells.has("2026-04-22_15:00")).toBe(false);
  });

  it("maps cell key to slot id", () => {
    const out = slotsToCells(slots, tz);
    expect(out.slotIdByCell.get("2026-04-22_14:00")).toBe("s_2026-04-22T05:00:00.000Z");
    expect(out.slotIdByCell.get("2026-04-23_15:00")).toBe("s_2026-04-23T06:00:00.000Z");
  });
});
