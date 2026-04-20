import { describe, it, expect } from "vitest";
import { findMatchings } from "../src/matching";

describe("findMatchings", () => {
  it("returns empty for no participants", () => {
    const out = findMatchings({ participants: [], slotIds: ["s1", "s2"] });
    expect(out.maxSize).toBe(0);
    expect(out.matchings).toEqual([]);
    expect(out.totalParticipants).toBe(0);
    expect(out.truncated).toBe(false);
  });

  it("returns empty for no slots", () => {
    const out = findMatchings({
      participants: [{ id: "p1", availableSlotIds: [] }],
      slotIds: [],
    });
    expect(out.maxSize).toBe(0);
    expect(out.matchings).toHaveLength(1);
    expect(out.matchings[0].assignments).toEqual({});
    expect(out.matchings[0].unmatched).toEqual(["p1"]);
  });

  it("matches single participant to their only available slot", () => {
    const out = findMatchings({
      participants: [{ id: "p1", availableSlotIds: ["s1"] }],
      slotIds: ["s1", "s2"],
    });
    expect(out.maxSize).toBe(1);
    expect(out.matchings).toHaveLength(1);
    expect(out.matchings[0].assignments).toEqual({ p1: "s1" });
    expect(out.matchings[0].unmatched).toEqual([]);
  });

  it("finds perfect matching when each gets unique slot", () => {
    const out = findMatchings({
      participants: [
        { id: "p1", availableSlotIds: ["s1"] },
        { id: "p2", availableSlotIds: ["s2"] },
        { id: "p3", availableSlotIds: ["s3"] },
      ],
      slotIds: ["s1", "s2", "s3"],
    });
    expect(out.maxSize).toBe(3);
    expect(out.matchings).toHaveLength(1);
    expect(out.matchings[0].assignments).toEqual({ p1: "s1", p2: "s2", p3: "s3" });
    expect(out.matchings[0].unmatched).toEqual([]);
  });

  it("reports unmatched participants when max < total", () => {
    const out = findMatchings({
      participants: [
        { id: "p1", availableSlotIds: ["s1"] },
        { id: "p2", availableSlotIds: ["s1"] },
        { id: "p3", availableSlotIds: ["s1"] },
      ],
      slotIds: ["s1"],
    });
    expect(out.maxSize).toBe(1);
    expect(out.matchings).toHaveLength(3);
    const unmatchedSets = out.matchings.map((m) => new Set(m.unmatched));
    expect(unmatchedSets.some((s) => s.has("p2") && s.has("p3"))).toBe(true);
    expect(unmatchedSets.some((s) => s.has("p1") && s.has("p3"))).toBe(true);
    expect(unmatchedSets.some((s) => s.has("p1") && s.has("p2"))).toBe(true);
  });

  it("enumerates distinct matchings in symmetric case", () => {
    const out = findMatchings({
      participants: [
        { id: "p1", availableSlotIds: ["s1", "s2"] },
        { id: "p2", availableSlotIds: ["s1", "s2"] },
      ],
      slotIds: ["s1", "s2"],
    });
    expect(out.maxSize).toBe(2);
    expect(out.matchings).toHaveLength(2);
    const keys = out.matchings.map((m) => `${m.assignments.p1}|${m.assignments.p2}`).sort();
    expect(keys).toEqual(["s1|s2", "s2|s1"]);
  });

  it("respects cap and sets truncated=true", () => {
    // 3! = 6 complete matchings; cap=2 limits
    const out = findMatchings({
      participants: [
        { id: "p1", availableSlotIds: ["s1", "s2", "s3"] },
        { id: "p2", availableSlotIds: ["s1", "s2", "s3"] },
        { id: "p3", availableSlotIds: ["s1", "s2", "s3"] },
      ],
      slotIds: ["s1", "s2", "s3"],
      cap: 2,
    });
    expect(out.maxSize).toBe(3);
    expect(out.matchings).toHaveLength(2);
    expect(out.truncated).toBe(true);
  });

  it("does not set truncated when all enumerated below cap", () => {
    const out = findMatchings({
      participants: [
        { id: "p1", availableSlotIds: ["s1"] },
        { id: "p2", availableSlotIds: ["s2"] },
      ],
      slotIds: ["s1", "s2"],
      cap: 20,
    });
    expect(out.truncated).toBe(false);
    expect(out.matchings).toHaveLength(1);
  });

  it("defaults cap to 20", () => {
    // 5! = 120 > 20 → truncated
    const slots = ["s1", "s2", "s3", "s4", "s5"];
    const participants = [1, 2, 3, 4, 5].map((i) => ({
      id: `p${i}`,
      availableSlotIds: slots,
    }));
    const out = findMatchings({ participants, slotIds: slots });
    expect(out.matchings.length).toBeLessThanOrEqual(20);
    expect(out.truncated).toBe(true);
  });

  it("handles partial matching with multiple distinct outcomes", () => {
    // p1: s1, s2  p2: s2 → max=2, unique matching {p1:s1, p2:s2}
    const out = findMatchings({
      participants: [
        { id: "p1", availableSlotIds: ["s1", "s2"] },
        { id: "p2", availableSlotIds: ["s2"] },
      ],
      slotIds: ["s1", "s2"],
    });
    expect(out.maxSize).toBe(2);
    expect(out.matchings).toHaveLength(1);
    expect(out.matchings[0].assignments).toEqual({ p1: "s1", p2: "s2" });
  });

  it("handles participant with no available slots", () => {
    const out = findMatchings({
      participants: [
        { id: "p1", availableSlotIds: ["s1"] },
        { id: "p2", availableSlotIds: [] },
      ],
      slotIds: ["s1"],
    });
    expect(out.maxSize).toBe(1);
    expect(out.matchings).toHaveLength(1);
    expect(out.matchings[0].assignments).toEqual({ p1: "s1" });
    expect(out.matchings[0].unmatched).toEqual(["p2"]);
  });
});
