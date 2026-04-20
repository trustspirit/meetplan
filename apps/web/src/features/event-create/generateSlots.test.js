import { describe, it, expect } from "vitest";
import { buildSlotsFromPaintedCells } from "./generateSlots";
describe("buildSlotsFromPaintedCells", () => {
    const tz = "Asia/Seoul";
    it("returns empty for no cells", () => {
        expect(buildSlotsFromPaintedCells(new Set(), 30, tz)).toEqual([]);
    });
    it("converts a single painted cell into one slot", () => {
        const cells = new Set(["2026-04-22_14:00"]);
        const slots = buildSlotsFromPaintedCells(cells, 30, tz);
        expect(slots).toHaveLength(1);
        expect(slots[0].id).toBe("s_2026-04-22T05:00:00.000Z");
    });
    it("produces slots sorted by start time", () => {
        const cells = new Set(["2026-04-23_10:00", "2026-04-22_14:00", "2026-04-22_14:30"]);
        const slots = buildSlotsFromPaintedCells(cells, 30, tz);
        expect(slots.map((s) => s.start)).toEqual([
            "2026-04-22T05:00:00.000Z",
            "2026-04-22T05:30:00.000Z",
            "2026-04-23T01:00:00.000Z",
        ]);
    });
    it("honors the period for slot end", () => {
        const cells = new Set(["2026-04-22_14:00"]);
        const slots = buildSlotsFromPaintedCells(cells, 60, tz);
        expect(slots[0].end).toBe("2026-04-22T06:00:00.000Z");
    });
});
