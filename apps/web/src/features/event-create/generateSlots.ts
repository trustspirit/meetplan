import { type Slot, slotId, toZonedInstant } from "@meetplan/shared";
import { parseCellKey } from "./useEventCreateState";

export function buildSlotsFromPaintedCells(
  paintedCells: Set<string>,
  periodMinutes: number,
  tz: string
): Slot[] {
  const slots: Slot[] = [];
  for (const key of paintedCells) {
    const { dateYmd, hhmm } = parseCellKey(key);
    const startIso = toZonedInstant(dateYmd, hhmm, tz);
    const endIso = new Date(
      new Date(startIso).getTime() + periodMinutes * 60 * 1000
    ).toISOString();
    slots.push({ id: slotId(startIso), start: startIso, end: endIso });
  }
  return slots.sort((a, b) => a.start.localeCompare(b.start));
}
