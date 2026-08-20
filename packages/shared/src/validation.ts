import { z } from "zod";

export const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/-/g, "");
}

/**
 * 한국 휴대폰 번호 입력 중 자동 포맷팅 (010-XXXX-XXXX).
 * 입력에서 숫자만 추출하고 최대 11자리로 자르며, 위치에 맞게 하이픈 삽입.
 * - 0 ~ 3자리: 하이픈 없음
 * - 4 ~ 7자리: 3자리 뒤 하이픈 하나 (`010-1234`)
 * - 8 ~ 11자리: 3자리·7자리 뒤 하이픈 (`010-1234-5678`)
 */
export function formatKoreanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export const MAX_RESPONSE_FIELDS = 10;
export const MAX_FIELD_LABEL_LENGTH = 40;
export const MAX_ANSWER_LENGTH = 200;

/** Firestore 맵 키 제약(`/` 불가, `__` 시작 불가)을 피하는 안전한 형태. */
export const FIELD_ID_RE = /^[A-Za-z0-9-]{1,64}$/;

export const responseFieldSchema = z.object({
  id: z.string().regex(FIELD_ID_RE, "항목 ID 형식이 올바르지 않습니다"),
  label: z.string().trim().min(1, "항목 이름을 입력해주세요").max(MAX_FIELD_LABEL_LENGTH),
  required: z.boolean(),
});

const slotSchema = z.object({
  id: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

const wardAssignmentSchema = z.object({
  wardId: z.string().min(1),
  wardName: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const eventCreateSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  periodMinutes: z.number().int().min(0).max(180),
  timezone: z.string().min(1),
  slots: z.array(slotSchema).refine(
    (slots) => new Set(slots.map((s) => s.id)).size === slots.length,
    { message: "슬롯 ID가 중복되었습니다" }
  ),
  eventType: z.enum(["meeting", "ward_visit"]).default("meeting"),
  stakeId: z.string().optional(),
  wardVisitDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  collectPhone: z.boolean().default(true),
  responseFields: z.array(responseFieldSchema)
    .max(MAX_RESPONSE_FIELDS, `항목은 최대 ${MAX_RESPONSE_FIELDS}개까지 추가할 수 있습니다`)
    .default([])
    .refine(
      (fields) => new Set(fields.map((f) => f.id)).size === fields.length,
      { message: "항목 ID가 중복되었습니다" }
    ),
}).refine(data => {
  if (data.eventType === "ward_visit") {
    return !!data.stakeId && (data.wardVisitDates?.length ?? 0) > 0;
  }
  return data.slots.length > 0 && data.periodMinutes >= 1;
}, { message: "필수 정보가 누락되었습니다" });

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const responseSubmitSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1).max(40),
  // 이벤트가 전화번호를 받는지는 스키마가 알 수 없다(입력만 본다).
  // "받는 이벤트인데 안 보냄"은 validateResponseInput이 서버에서 잡는다.
  phone: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().regex(phoneRegex, "010-1234-5678 형식으로 입력해주세요").optional()
  ),
  note: z.preprocess(
    (value) => value === null ? undefined : value,
    z.string().max(300).optional()
  ),
  selectedSlotIds: z.array(z.string()),
  answers: z.record(
    z.string().regex(FIELD_ID_RE),
    z.string().max(MAX_ANSWER_LENGTH, `답변은 ${MAX_ANSWER_LENGTH}자를 넘을 수 없습니다`)
  ).default({}),
  wardAssignments: z.array(wardAssignmentSchema).optional(),
  rid: z.string().optional(),
  token: z.string().optional(),
}).refine(
  data => data.selectedSlotIds.length > 0 || (data.wardAssignments && data.wardAssignments.length > 0),
  { message: "슬롯 또는 와드 배정이 필요합니다" }
);

export type ResponseSubmitInput = z.infer<typeof responseSubmitSchema>;
