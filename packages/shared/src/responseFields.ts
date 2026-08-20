import type { ResponseField } from "./types";
import { phoneRegex, MAX_ANSWER_LENGTH } from "./validation";

/**
 * 이 이벤트가 전화번호를 수집하는가.
 *
 * `collectPhone`이 undefined인 문서는 이 기능 이전에 만들어진 이벤트다. 그때는
 * 전화번호가 항상 필수였으므로 true로 읽어야 기존 동작이 유지된다.
 * `?? true`와 `!== false`가 파일마다 갈리면 미묘한 버그가 생기므로 해석은 여기서만 한다.
 */
export function eventCollectsPhone(e: { collectPhone?: boolean }): boolean {
  return e.collectPhone !== false;
}

/** 이벤트의 커스텀 수집 항목. 레거시 이벤트는 빈 배열. */
export function eventResponseFields(e: { responseFields?: ResponseField[] }): ResponseField[] {
  return e.responseFields ?? [];
}

export type ResponseValidationError =
  | { code: "name_missing" }
  | { code: "phone_missing" }
  | { code: "phone_invalid" }
  | { code: "slots_missing" }
  | { code: "field_required"; fieldId: string; label: string }
  | { code: "field_too_long"; fieldId: string; label: string }
  | { code: "unknown_field"; fieldId: string };

export interface ResponseConfig {
  collectPhone: boolean;
  fields: ResponseField[];
  /** ward_visit은 슬롯 대신 와드 배정을 쓰므로 false. meeting은 true. */
  requireSlots: boolean;
}

export interface ResponseInputView {
  name: string;
  phone?: string | undefined;
  answers: Record<string, string>;
  selectedSlotCount: number;
}

/**
 * 응답 입력이 이벤트 설정을 만족하는지 검사한다. 통과하면 null, 아니면 첫 번째 위반.
 *
 * 순수 함수라 서버와 웹이 공유한다. 서버(submitResponse)가 권위이고, 웹은 같은 결과로
 * 제출 버튼 비활성 사유를 보여준다. 두 곳이 각자 판단하면 어긋난다.
 */
export function validateResponseInput(
  cfg: ResponseConfig,
  input: ResponseInputView
): ResponseValidationError | null {
  if (input.name.trim().length === 0) return { code: "name_missing" };

  if (cfg.requireSlots && input.selectedSlotCount === 0) return { code: "slots_missing" };

  if (cfg.collectPhone) {
    const phone = input.phone?.trim() ?? "";
    if (phone.length === 0) return { code: "phone_missing" };
    if (!phoneRegex.test(phone)) return { code: "phone_invalid" };
  }

  const known = new Set(cfg.fields.map((f) => f.id));
  for (const key of Object.keys(input.answers)) {
    if (!known.has(key)) return { code: "unknown_field", fieldId: key };
  }

  for (const field of cfg.fields) {
    const value = (input.answers[field.id] ?? "").trim();
    if (field.required && value.length === 0) {
      return { code: "field_required", fieldId: field.id, label: field.label };
    }
    if (value.length > MAX_ANSWER_LENGTH) {
      return { code: "field_too_long", fieldId: field.id, label: field.label };
    }
  }

  return null;
}

/**
 * 저장 직전 정리: 정의되지 않은 키 제거, trim, 빈 값 제거.
 * 서버만 호출한다 — 클라이언트가 보낸 것을 그대로 믿지 않는다.
 */
export function sanitizeAnswers(
  fields: ResponseField[],
  answers: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
    const value = (answers[field.id] ?? "").trim();
    if (value.length > 0) out[field.id] = value;
  }
  return out;
}
