import { describe, it, expect } from "vitest";
import { buildTimeAxis } from "./timeAxis";

describe("buildTimeAxis", () => {
  it("generates HH:mm tick labels at period interval", () => {
    expect(buildTimeAxis("09:00", "11:00", 30)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("excludes the end tick", () => {
    expect(buildTimeAxis("09:00", "10:00", 30)).toEqual(["09:00", "09:30"]);
  });

  it("handles 15-min period", () => {
    const out = buildTimeAxis("14:00", "15:00", 15);
    expect(out).toEqual(["14:00", "14:15", "14:30", "14:45"]);
  });

  it("returns empty when start >= end", () => {
    expect(buildTimeAxis("14:00", "14:00", 30)).toEqual([]);
  });

  it("handles midnight crossing: 23:00 to 00:00 with 60-min period", () => {
    expect(buildTimeAxis("23:00", "00:00", 60)).toEqual(["23:00"]);
  });

  it("handles midnight crossing: 22:00 to 00:00 with 60-min period", () => {
    expect(buildTimeAxis("22:00", "00:00", 60)).toEqual(["22:00", "23:00"]);
  });
});
