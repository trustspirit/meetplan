import { formatInTimeZone } from "date-fns-tz";
import type { Slot } from "@meetplan/shared";

export interface CellGridModel {
  dates: string[];                           // YYYY-MM-DD, sorted
  times: string[];                           // HH:mm, sorted
  availableCells: Set<string>;               // "YYYY-MM-DD_HH:mm"
  slotIdByCell: Map<string, string>;         // cellKey -> slot.id
}

export function slotsToCells(slots: Slot[], viewerTz: string): CellGridModel {
  const datesSet = new Set<string>();
  const timesSet = new Set<string>();
  const availableCells = new Set<string>();
  const slotIdByCell = new Map<string, string>();

  for (const slot of slots) {
    const date = formatInTimeZone(slot.start, viewerTz, "yyyy-MM-dd");
    const time = formatInTimeZone(slot.start, viewerTz, "HH:mm");
    datesSet.add(date);
    timesSet.add(time);
    const cell = `${date}_${time}`;
    availableCells.add(cell);
    slotIdByCell.set(cell, slot.id);
  }

  return {
    dates: [...datesSet].sort(),
    times: [...timesSet].sort(),
    availableCells,
    slotIdByCell,
  };
}
