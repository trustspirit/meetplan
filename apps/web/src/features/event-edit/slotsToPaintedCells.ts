import { formatInTimeZone } from "date-fns-tz";
import type { Slot } from "@meetplan/shared";

export interface PaintedCellsState {
  selectedDates: string[];               // YYYY-MM-DD, viewer TZ, sorted unique
  paintedCells: Set<string>;             // "YYYY-MM-DD_HH:mm"
  dailyRange: [string, string];          // [startHHmm, endHHmm] — min start ~ max end
}

const DEFAULT_RANGE: [string, string] = ["09:00", "18:00"];

export function slotsToPaintedCells(
  slots: Slot[],
  _periodMinutes: number,
  viewerTz: string
): PaintedCellsState {
  if (slots.length === 0) {
    return {
      selectedDates: [],
      paintedCells: new Set(),
      dailyRange: DEFAULT_RANGE,
    };
  }

  const datesSet = new Set<string>();
  const paintedCells = new Set<string>();
  let minStartMin = Number.POSITIVE_INFINITY;
  let maxEndMin = Number.NEGATIVE_INFINITY;

  for (const slot of slots) {
    const date = formatInTimeZone(slot.start, viewerTz, "yyyy-MM-dd");
    const startHHmm = formatInTimeZone(slot.start, viewerTz, "HH:mm");
    const endHHmm = formatInTimeZone(slot.end, viewerTz, "HH:mm");

    datesSet.add(date);
    paintedCells.add(`${date}_${startHHmm}`);

    const startMin = toMinutes(startHHmm);
    // "00:00" end means next-day midnight; treat as 1440 so range covers it
    const endMin = endHHmm === "00:00" ? 1440 : toMinutes(endHHmm);
    if (startMin < minStartMin) minStartMin = startMin;
    if (endMin > maxEndMin) maxEndMin = endMin;
  }

  // dailyRange는 날짜별 값이 아니라 "표시 창"이다 (스펙 §7).
  // 모든 슬롯을 덮는 최소 구간을 돌려주며, 날짜별 가용 시간대는 paintedCells가 표현한다.
  return {
    selectedDates: [...datesSet].sort(),
    paintedCells,
    dailyRange: [toHHmm(minStartMin), toHHmm(maxEndMin)],
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
}

function toHHmm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
