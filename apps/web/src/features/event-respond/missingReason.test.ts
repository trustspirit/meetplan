import { describe, it, expect } from "vitest";
import { describeMissing, resolveMissingReason } from "./missingReason";

describe("describeMissing", () => {
  it("null이면 null", () => {
    expect(describeMissing(null)).toBeNull();
  });

  it("이름 누락", () => {
    expect(describeMissing({ code: "name_missing" })).toBe("이름을 입력해주세요");
  });

  it("슬롯 누락", () => {
    expect(describeMissing({ code: "slots_missing" })).toBe("가능한 시간을 골라주세요");
  });

  it("전화번호 누락과 형식 오류는 같은 안내", () => {
    expect(describeMissing({ code: "phone_missing" })).toBe("연락처를 확인해주세요");
    expect(describeMissing({ code: "phone_invalid" })).toBe("연락처를 확인해주세요");
  });

  it("필수 항목 누락은 라벨을 넣어 안내한다", () => {
    expect(describeMissing({ code: "field_required", fieldId: "team", label: "소속" }))
      .toBe("소속을(를) 입력해주세요");
  });

  it("답변 길이 초과", () => {
    expect(describeMissing({ code: "field_too_long", fieldId: "team", label: "소속" }))
      .toBe("소속이(가) 너무 깁니다");
  });

  it("정의되지 않은 항목은 일반 오류로 낮춘다", () => {
    expect(describeMissing({ code: "unknown_field", fieldId: "ghost" })).toBe("입력 오류");
  });
});

describe("resolveMissingReason", () => {
  it("제출 중이 아니고 위반이 없으면 null", () => {
    expect(resolveMissingReason({ submitting: false, violation: null })).toBeNull();
  });

  it("제출 중이면 위반이 없어도 null", () => {
    expect(resolveMissingReason({ submitting: true, violation: null })).toBeNull();
  });

  it("제출 중에는 사유를 내지 않는다 (깜빡임 회귀 방지)", () => {
    expect(resolveMissingReason({ submitting: true, violation: { code: "phone_missing" } })).toBeNull();
  });

  it("제출 중이 아니면 위반 사유를 그대로 안내한다", () => {
    expect(resolveMissingReason({ submitting: false, violation: { code: "phone_missing" } }))
      .toBe("연락처를 확인해주세요");
  });
});
