import type { CellGridModel } from "./slotsToCells";

export interface DateSelection {
  dateYmd: string;
  /** 그 날짜에 호스트가 연 슬롯 수 */
  totalSlots: number;
  /** 참가자가 고른 시각들 (HH:mm, 오름차순) */
  selectedTimes: string[];
}

/**
 * 그리드와 선택 상태를 날짜별 요약으로 접는다.
 * 모바일 Step 2의 섹션 헤더와 데스크탑 우측 요약이 이 모델을 공유한다 (스펙 §8.5, §8.6).
 */
export function buildSelectionModel(
  grid: CellGridModel,
  selectedSlotIds: Set<string>
): DateSelection[] {
  const totals = new Map<string, number>();
  const selected = new Map<string, string[]>();

  for (const [cellKey, slotId] of grid.slotIdByCell) {
    const idx = cellKey.indexOf("_");
    if (idx < 1) continue;
    const dateYmd = cellKey.slice(0, idx);
    const hhmm = cellKey.slice(idx + 1);

    totals.set(dateYmd, (totals.get(dateYmd) ?? 0) + 1);
    if (selectedSlotIds.has(slotId)) {
      const list = selected.get(dateYmd) ?? [];
      list.push(hhmm);
      selected.set(dateYmd, list);
    }
  }

  return grid.dates.map((dateYmd) => ({
    dateYmd,
    totalSlots: totals.get(dateYmd) ?? 0,
    selectedTimes: (selected.get(dateYmd) ?? []).sort(),
  }));
}
