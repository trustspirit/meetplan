import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";
import type { MeetplanEvent, ParticipantResponse } from "@meetplan/shared";

export interface SlotColumn {
  slotId: string;
  dateYmd: string;        // e.g., "2026-04-22"
  dateLabel: string;      // e.g., "4/22 (수)"
  timeLabel: string;      // e.g., "14:00"
}

export interface MatrixRow {
  responseId: string;
  name: string;
  phone: string;
  checks: Record<string, boolean>; // slotId -> checked
}

// Grouped view: date columns × time rows
export interface DateGroup {
  dateYmd: string;
  dateLabel: string;
}

export interface TimeGroup {
  hhmm: string;
}

export interface GroupedCell {
  slotId: string;
  count: number;
  participantNames: string[];
}

export interface MatrixModel {
  slotColumns: SlotColumn[];
  rows: MatrixRow[];
  slotCounts: Record<string, number>; // slotId -> number of participants who selected
  // Grouped date×time grid
  dateGroups: DateGroup[];
  timeGroups: TimeGroup[];
  groupedCells: Record<string, GroupedCell>; // key: "YYYY-MM-DD_HH:mm"
}

export function buildMatrixModel(
  event: MeetplanEvent,
  responses: ParticipantResponse[],
  viewerTz: string
): MatrixModel {
  const slotColumns: SlotColumn[] = event.slots.map((s) => ({
    slotId: s.id,
    dateYmd: formatInTimeZone(s.start, viewerTz, "yyyy-MM-dd"),
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

  // Build date×time grouped structure
  const dateMap = new Map<string, DateGroup>();
  const timeSet = new Set<string>();

  for (const col of slotColumns) {
    if (!dateMap.has(col.dateYmd)) {
      dateMap.set(col.dateYmd, { dateYmd: col.dateYmd, dateLabel: col.dateLabel });
    }
    timeSet.add(col.timeLabel);
  }

  const dateGroups = [...dateMap.values()];
  const timeGroups = [...timeSet].sort().map((hhmm) => ({ hhmm }));

  const groupedCells: Record<string, GroupedCell> = {};
  for (const col of slotColumns) {
    const key = `${col.dateYmd}_${col.timeLabel}`;
    groupedCells[key] = {
      slotId: col.slotId,
      count: slotCounts[col.slotId] ?? 0,
      participantNames: rows.filter((r) => r.checks[col.slotId]).map((r) => r.name),
    };
  }

  return { slotColumns, rows, slotCounts, dateGroups, timeGroups, groupedCells };
}
