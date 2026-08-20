import { describe, it, expect } from "vitest";
import { buildSelectionModel } from "./selectionModel";
import type { CellGridModel } from "./slotsToCells";

const grid: CellGridModel = {
  dates: ["2026-06-02", "2026-06-03"],
  times: ["09:00", "09:30", "10:00"],
  availableCells: new Set([
    "2026-06-02_09:00", "2026-06-02_09:30",
    "2026-06-03_09:00", "2026-06-03_10:00",
  ]),
  slotIdByCell: new Map([
    ["2026-06-02_09:00", "s1"],
    ["2026-06-02_09:30", "s2"],
    ["2026-06-03_09:00", "s3"],
    ["2026-06-03_10:00", "s4"],
  ]),
};

describe("buildSelectionModel", () => {
  it("날짜별로 전체 슬롯 수를 센다", () => {
    const model = buildSelectionModel(grid, new Set());
    expect(model.map((d) => [d.dateYmd, d.totalSlots])).toEqual([
      ["2026-06-02", 2],
      ["2026-06-03", 2],
    ]);
  });

  it("선택이 없으면 selectedTimes는 빈 배열", () => {
    const model = buildSelectionModel(grid, new Set());
    expect(model.every((d) => d.selectedTimes.length === 0)).toBe(true);
  });

  it("선택된 슬롯의 시각을 날짜별로 모은다", () => {
    const model = buildSelectionModel(grid, new Set(["s1", "s2", "s4"]));
    expect(model[0]!.selectedTimes).toEqual(["09:00", "09:30"]);
    expect(model[1]!.selectedTimes).toEqual(["10:00"]);
  });

  it("시각은 오름차순으로 정렬된다", () => {
    const model = buildSelectionModel(grid, new Set(["s4", "s3"]));
    expect(model[1]!.selectedTimes).toEqual(["09:00", "10:00"]);
  });

  it("존재하지 않는 slotId는 무시한다", () => {
    const model = buildSelectionModel(grid, new Set(["없는-id"]));
    expect(model.every((d) => d.selectedTimes.length === 0)).toBe(true);
  });
});
