import { describe, it, expect } from "vitest";
import {
  phoneRegex,
  normalizePhone,
  formatKoreanPhone,
  eventCreateSchema,
  responseSubmitSchema,
} from "../src/validation";

describe("phoneRegex", () => {
  it.each([
    ["010-1234-5678", true],
    ["01012345678", true],
    ["010-123-4567", true],
    ["02-123-4567", false],
    ["010 1234 5678", false],
    ["1234", false],
    ["", false],
  ])("%s -> %s", (input, expected) => {
    expect(phoneRegex.test(input)).toBe(expected);
  });
});

describe("normalizePhone", () => {
  it("strips hyphens", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
    expect(normalizePhone("01012345678")).toBe("01012345678");
  });
});

describe("formatKoreanPhone", () => {
  it.each([
    ["", ""],
    ["0", "0"],
    ["01", "01"],
    ["010", "010"],
    ["0101", "010-1"],
    ["01012", "010-12"],
    ["010123", "010-123"],
    ["0101234", "010-1234"],
    ["01012345", "010-1234-5"],
    ["010123456", "010-1234-56"],
    ["0101234567", "010-1234-567"],
    ["01012345678", "010-1234-5678"],
  ])("progressive formatting: %s -> %s", (input, expected) => {
    expect(formatKoreanPhone(input)).toBe(expected);
  });

  it("strips non-digit characters from input", () => {
    expect(formatKoreanPhone("010.1234.5678")).toBe("010-1234-5678");
    expect(formatKoreanPhone("010 1234 5678")).toBe("010-1234-5678");
    expect(formatKoreanPhone("010-1234-5678")).toBe("010-1234-5678");
  });

  it("truncates to 11 digits maximum", () => {
    expect(formatKoreanPhone("010123456789999")).toBe("010-1234-5678");
  });

  it("is idempotent on already-formatted input", () => {
    const formatted = "010-1234-5678";
    expect(formatKoreanPhone(formatted)).toBe(formatted);
  });
});

describe("eventCreateSchema", () => {
  const valid = {
    title: "2분기 1:1 미팅",
    periodMinutes: 30,
    timezone: "Asia/Seoul",
    slots: [{ id: "s_2026-04-22T05:00:00.000Z", start: "2026-04-22T05:00:00.000Z", end: "2026-04-22T05:30:00.000Z" }],
  };
  it("accepts valid payload", () => {
    expect(eventCreateSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects empty title", () => {
    expect(eventCreateSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });
  it("rejects zero slots", () => {
    expect(eventCreateSchema.safeParse({ ...valid, slots: [] }).success).toBe(false);
  });
  it("rejects invalid periodMinutes", () => {
    expect(eventCreateSchema.safeParse({ ...valid, periodMinutes: 0 }).success).toBe(false);
    expect(eventCreateSchema.safeParse({ ...valid, periodMinutes: 500 }).success).toBe(false);
  });
});

describe("responseSubmitSchema", () => {
  const valid = {
    eventId: "abc123",
    name: "김민수",
    phone: "010-1234-5678",
    selectedSlotIds: ["s_2026-04-22T05:00:00.000Z"],
  };
  it("accepts valid", () => {
    expect(responseSubmitSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects bad phone", () => {
    expect(responseSubmitSchema.safeParse({ ...valid, phone: "xyz" }).success).toBe(false);
  });
  it("rejects zero selected slots", () => {
    expect(responseSubmitSchema.safeParse({ ...valid, selectedSlotIds: [] }).success).toBe(false);
  });
});
