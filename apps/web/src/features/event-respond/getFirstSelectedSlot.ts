import type { CellGridModel } from "./slotsToCells";

export interface SlotPreview {
  date: string;      // "YYYY-MM-DD"
  time: string;      // "HH:mm"
  remaining: number; // 첫 슬롯 제외한 나머지 선택 슬롯 수
}

export function getFirstSelectedSlot(
  grid: CellGridModel,
  selectedSlotIds: Set<string>
): SlotPreview | null {
  if (selectedSlotIds.size === 0) return null;

  const matchedKeys: string[] = [];
  for (const [cellKey, slotId] of grid.slotIdByCell) {
    if (selectedSlotIds.has(slotId)) matchedKeys.push(cellKey);
  }

  if (matchedKeys.length === 0) return null;

  matchedKeys.sort();
  const first = matchedKeys[0]!;
  const [date, time] = first.split("_") as [string, string];
  return { date, time, remaining: matchedKeys.length - 1 };
}
