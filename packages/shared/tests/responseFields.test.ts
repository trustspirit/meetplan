import { describe, it, expect } from "vitest";
import {
  eventCollectsPhone,
  eventResponseFields,
  validateResponseInput,
  sanitizeAnswers,
  type ResponseConfig,
  type ResponseInputView,
} from "../src/responseFields";
import type { ResponseField } from "../src/types";

const FIELDS: ResponseField[] = [
  { id: "team", label: "소속", required: true },
  { id: "car", label: "차량 유무", required: false },
];

const CFG: ResponseConfig = { collectPhone: true, fields: FIELDS, requireSlots: true };

const OK: ResponseInputView = {
  name: "김민수",
  phone: "010-1234-5678",
  answers: { team: "1팀" },
  selectedSlotCount: 2,
};

describe("eventCollectsPhone", () => {
  it("undefined는 true로 읽는다 (레거시 이벤트)", () => {
    expect(eventCollectsPhone({})).toBe(true);
  });

  it("true는 true", () => {
    expect(eventCollectsPhone({ collectPhone: true })).toBe(true);
  });

  it("false만 false", () => {
    expect(eventCollectsPhone({ collectPhone: false })).toBe(false);
  });
});

describe("eventResponseFields", () => {
  it("undefined는 빈 배열로 읽는다 (레거시 이벤트)", () => {
    expect(eventResponseFields({})).toEqual([]);
  });

  it("있으면 그대로 돌려준다", () => {
    expect(eventResponseFields({ responseFields: FIELDS })).toBe(FIELDS);
  });
});

describe("validateResponseInput", () => {
  it("모두 충족하면 null", () => {
    expect(validateResponseInput(CFG, OK)).toBeNull();
  });

  it("이름이 공백이면 name_missing", () => {
    expect(validateResponseInput(CFG, { ...OK, name: "  " })).toEqual({ code: "name_missing" });
  });

  it("requireSlots인데 슬롯이 0개면 slots_missing", () => {
    expect(validateResponseInput(CFG, { ...OK, selectedSlotCount: 0 }))
      .toEqual({ code: "slots_missing" });
  });

  it("requireSlots가 false면 슬롯 0개를 허용한다 (ward_visit)", () => {
    const cfg = { ...CFG, requireSlots: false };
    expect(validateResponseInput(cfg, { ...OK, selectedSlotCount: 0 })).toBeNull();
  });

  it("전화번호를 받는데 없으면 phone_missing", () => {
    expect(validateResponseInput(CFG, { ...OK, phone: undefined }))
      .toEqual({ code: "phone_missing" });
  });

  it("전화번호 형식이 틀리면 phone_invalid", () => {
    expect(validateResponseInput(CFG, { ...OK, phone: "123" }))
      .toEqual({ code: "phone_invalid" });
  });

  it("전화번호를 안 받으면 없어도 통과한다", () => {
    const cfg = { ...CFG, collectPhone: false };
    expect(validateResponseInput(cfg, { ...OK, phone: undefined })).toBeNull();
  });

  it("전화번호를 안 받으면 형식이 틀려도 무시한다", () => {
    const cfg = { ...CFG, collectPhone: false };
    expect(validateResponseInput(cfg, { ...OK, phone: "쓰레기" })).toBeNull();
  });

  it("필수 항목이 비어 있으면 field_required", () => {
    expect(validateResponseInput(CFG, { ...OK, answers: {} }))
      .toEqual({ code: "field_required", fieldId: "team", label: "소속" });
  });

  it("필수 항목이 공백만이면 field_required", () => {
    expect(validateResponseInput(CFG, { ...OK, answers: { team: "   " } }))
      .toEqual({ code: "field_required", fieldId: "team", label: "소속" });
  });

  it("선택 항목은 비어도 통과한다", () => {
    expect(validateResponseInput(CFG, { ...OK, answers: { team: "1팀" } })).toBeNull();
  });

  it("정의되지 않은 항목 키는 unknown_field", () => {
    expect(validateResponseInput(CFG, { ...OK, answers: { team: "1팀", ghost: "x" } }))
      .toEqual({ code: "unknown_field", fieldId: "ghost" });
  });

  it("답변이 200자를 넘으면 field_too_long", () => {
    expect(validateResponseInput(CFG, { ...OK, answers: { team: "가".repeat(201) } }))
      .toEqual({ code: "field_too_long", fieldId: "team", label: "소속" });
  });

  it("검사 순서는 이름 → 슬롯 → 전화번호 → 항목", () => {
    const broken: ResponseInputView = { name: "", phone: undefined, answers: {}, selectedSlotCount: 0 };
    expect(validateResponseInput(CFG, broken)).toEqual({ code: "name_missing" });
  });
});

describe("sanitizeAnswers", () => {
  it("정의되지 않은 키를 버린다", () => {
    expect(sanitizeAnswers(FIELDS, { team: "1팀", ghost: "x" })).toEqual({ team: "1팀" });
  });

  it("값을 trim한다", () => {
    expect(sanitizeAnswers(FIELDS, { team: "  1팀  " })).toEqual({ team: "1팀" });
  });

  it("빈 값은 저장하지 않는다", () => {
    expect(sanitizeAnswers(FIELDS, { team: "1팀", car: "   " })).toEqual({ team: "1팀" });
  });

  it("항목이 없으면 빈 객체", () => {
    expect(sanitizeAnswers([], { team: "1팀" })).toEqual({});
  });
});
