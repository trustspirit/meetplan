import { describe, it, expect } from "vitest";
import { slotId, toZonedInstant } from "../src/time";

describe("slotId", () => {
  it("returns a deterministic id from an ISO start timestamp", () => {
    expect(slotId("2026-04-22T14:00:00+09:00")).toBe("s_2026-04-22T05:00:00.000Z");
  });

  it("normalizes to UTC regardless of input offset", () => {
    expect(slotId("2026-04-22T05:00:00Z")).toBe("s_2026-04-22T05:00:00.000Z");
  });
});

describe("toZonedInstant", () => {
  it("converts a local date/time in a given IANA TZ into a UTC ISO", () => {
    expect(toZonedInstant("2026-04-22", "14:00", "Asia/Seoul")).toBe("2026-04-22T05:00:00.000Z");
  });

  it("handles UTC input", () => {
    expect(toZonedInstant("2026-04-22", "10:00", "UTC")).toBe("2026-04-22T10:00:00.000Z");
  });
});
