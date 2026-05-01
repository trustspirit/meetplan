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

const slotSchema = z.object({
  id: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const eventCreateSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  periodMinutes: z.number().int().min(5).max(180),
  timezone: z.string().min(1),
  slots: z.array(slotSchema).min(1).refine(
    (slots) => new Set(slots.map((s) => s.id)).size === slots.length,
    { message: "슬롯 ID가 중복되었습니다" }
  ),
});

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const responseSubmitSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1).max(40),
  phone: z.string().regex(phoneRegex, "010-1234-5678 형식으로 입력해주세요"),
  selectedSlotIds: z.array(z.string()).min(1),
  rid: z.string().optional(),
  token: z.string().optional(),
});

export type ResponseSubmitInput = z.infer<typeof responseSubmitSchema>;
