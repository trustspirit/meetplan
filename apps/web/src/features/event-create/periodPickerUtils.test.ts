import { describe, it, expect } from "vitest";
import { clampPeriod, nearestPreset, isPreset } from "./periodPickerUtils";

describe("clampPeriod", () => {
  it("clamps values below minimum to 5", () => expect(clampPeriod(3)).toBe(5));
  it("clamps values above maximum to 180", () => expect(clampPeriod(200)).toBe(180));
  it("passes valid values unchanged", () => expect(clampPeriod(45)).toBe(45));
  it("allows boundary value 5", () => expect(clampPeriod(5)).toBe(5));
  it("allows boundary value 180", () => expect(clampPeriod(180)).toBe(180));
});

describe("nearestPreset", () => {
  it("returns 15 for value 22 (|22-15|=7 < |22-30|=8)", () =>
    expect(nearestPreset(22)).toBe(15));
  it("returns 15 for small values like 7", () =>
    expect(nearestPreset(7)).toBe(15));
  it("returns 60 for large values like 75", () =>
    expect(nearestPreset(75)).toBe(60));
  it("returns exact preset when given exact preset value", () =>
    expect(nearestPreset(30)).toBe(30));
});

describe("isPreset", () => {
  it("returns true for all preset values", () => {
    expect(isPreset(15)).toBe(true);
    expect(isPreset(30)).toBe(true);
    expect(isPreset(45)).toBe(true);
    expect(isPreset(60)).toBe(true);
  });
  it("returns false for non-preset values", () => {
    expect(isPreset(20)).toBe(false);
    expect(isPreset(90)).toBe(false);
    expect(isPreset(0)).toBe(false);
  });
});
