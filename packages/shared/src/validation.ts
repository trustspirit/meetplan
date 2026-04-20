import { z } from "zod";

export const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/-/g, "");
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
  slots: z.array(slotSchema).min(1),
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
