import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";
import type { MeetplanEvent, ParticipantResponse } from "@meetplan/shared";

export interface SlotColumn {
  slotId: string;
  dateLabel: string;      // e.g., "4/22 (수)"
  timeLabel: string;      // e.g., "14:00"
}

export interface MatrixRow {
  responseId: string;
  name: string;
  phone: string;
  checks: Record<string, boolean>; // slotId -> checked
}

export interface MatrixModel {
  slotColumns: SlotColumn[];
  rows: MatrixRow[];
  slotCounts: Record<string, number>; // slotId -> number of participants who selected
}

export function buildMatrixModel(
  event: MeetplanEvent,
  responses: ParticipantResponse[],
  viewerTz: string
): MatrixModel {
  const slotColumns: SlotColumn[] = event.slots.map((s) => ({
    slotId: s.id,
    // Korean narrow weekday requires { locale: ko } — without it date-fns defaults to enUS and returns "W"
    dateLabel: formatInTimeZone(s.start, viewerTz, "M/d (EEEEE)", { locale: ko }),
    timeLabel: formatInTimeZone(s.start, viewerTz, "HH:mm"),
  }));

  const validSlotIds = new Set(event.slots.map((s) => s.id));

  const slotCounts: Record<string, number> = {};
  for (const s of event.slots) slotCounts[s.id] = 0;

  const rows: MatrixRow[] = responses.map((r) => {
    const checks: Record<string, boolean> = {};
    for (const s of event.slots) checks[s.id] = false;
    for (const sid of r.selectedSlotIds) {
      if (validSlotIds.has(sid)) {
        checks[sid] = true;
        slotCounts[sid] = (slotCounts[sid] ?? 0) + 1;
      }
    }
    return { responseId: r.id, name: r.name, phone: r.phone, checks };
  });

  return { slotColumns, rows, slotCounts };
}
