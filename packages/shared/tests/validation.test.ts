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
  it("treats null note as omitted", () => {
    const parsed = responseSubmitSchema.parse({ ...valid, note: null });

    expect(parsed.note).toBeUndefined();
  });
  it("rejects bad phone", () => {
    expect(responseSubmitSchema.safeParse({ ...valid, phone: "xyz" }).success).toBe(false);
  });
  it("rejects zero selected slots", () => {
    expect(responseSubmitSchema.safeParse({ ...valid, selectedSlotIds: [] }).success).toBe(false);
  });
});

const BASE_EVENT = {
  title: "테스트",
  periodMinutes: 30,
  timezone: "Asia/Seoul",
  slots: [{ id: "s1", start: "2026-06-02T00:00:00.000Z", end: "2026-06-02T00:30:00.000Z" }],
};

describe("eventCreateSchema — 수집 항목", () => {
  it("collectPhone과 responseFields는 지정하지 않으면 기본값이 채워진다", () => {
    const parsed = eventCreateSchema.parse(BASE_EVENT);
    expect(parsed.collectPhone).toBe(true);
    expect(parsed.responseFields).toEqual([]);
  });

  it("collectPhone을 false로 지정할 수 있다", () => {
    const parsed = eventCreateSchema.parse({ ...BASE_EVENT, collectPhone: false });
    expect(parsed.collectPhone).toBe(false);
  });

  it("커스텀 항목을 받는다", () => {
    const parsed = eventCreateSchema.parse({
      ...BASE_EVENT,
      responseFields: [{ id: "abc-1", label: "소속", required: true }],
    });
    expect(parsed.responseFields).toEqual([{ id: "abc-1", label: "소속", required: true }]);
  });

  it("항목이 10개를 넘으면 거부한다", () => {
    const fields = Array.from({ length: 11 }, (_, i) => ({
      id: `f${i}`, label: `항목${i}`, required: false,
    }));
    expect(eventCreateSchema.safeParse({ ...BASE_EVENT, responseFields: fields }).success).toBe(false);
  });

  it("항목 ID가 중복되면 거부한다", () => {
    const fields = [
      { id: "same", label: "A", required: false },
      { id: "same", label: "B", required: false },
    ];
    expect(eventCreateSchema.safeParse({ ...BASE_EVENT, responseFields: fields }).success).toBe(false);
  });

  it("라벨이 공백만이면 거부한다", () => {
    const fields = [{ id: "f1", label: "   ", required: false }];
    expect(eventCreateSchema.safeParse({ ...BASE_EVENT, responseFields: fields }).success).toBe(false);
  });

  it("라벨이 40자를 넘으면 거부한다", () => {
    const fields = [{ id: "f1", label: "가".repeat(41), required: false }];
    expect(eventCreateSchema.safeParse({ ...BASE_EVENT, responseFields: fields }).success).toBe(false);
  });
});

const BASE_RESPONSE = {
  eventId: "e1",
  name: "김민수",
  selectedSlotIds: ["s1"],
};

describe("responseSubmitSchema — 전화번호와 답변", () => {
  it("전화번호 없이도 통과한다 (이벤트 설정은 서버가 교차 검증)", () => {
    const parsed = responseSubmitSchema.parse(BASE_RESPONSE);
    expect(parsed.phone).toBeUndefined();
  });

  it("빈 문자열 전화번호는 undefined로 정규화한다", () => {
    const parsed = responseSubmitSchema.parse({ ...BASE_RESPONSE, phone: "  " });
    expect(parsed.phone).toBeUndefined();
  });

  it("형식이 틀린 전화번호는 거부한다", () => {
    expect(responseSubmitSchema.safeParse({ ...BASE_RESPONSE, phone: "123" }).success).toBe(false);
  });

  it("올바른 전화번호를 받는다", () => {
    const parsed = responseSubmitSchema.parse({ ...BASE_RESPONSE, phone: "010-1234-5678" });
    expect(parsed.phone).toBe("010-1234-5678");
  });

  it("answers는 지정하지 않으면 빈 객체다", () => {
    expect(responseSubmitSchema.parse(BASE_RESPONSE).answers).toEqual({});
  });

  it("answers를 받는다", () => {
    const parsed = responseSubmitSchema.parse({ ...BASE_RESPONSE, answers: { "abc-1": "1팀" } });
    expect(parsed.answers).toEqual({ "abc-1": "1팀" });
  });

  it("200자를 넘는 답변은 거부한다", () => {
    const long = { ...BASE_RESPONSE, answers: { "abc-1": "가".repeat(201) } };
    expect(responseSubmitSchema.safeParse(long).success).toBe(false);
  });
});
