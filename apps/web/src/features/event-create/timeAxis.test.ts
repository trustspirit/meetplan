import { describe, it, expect } from "vitest";
import { buildTimeAxis, buildDisplayAxis, timesOutsideRange } from "./timeAxis";

describe("buildTimeAxis", () => {
  it("generates HH:mm tick labels at period interval", () => {
    expect(buildTimeAxis("09:00", "11:00", 30)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("excludes the end tick", () => {
    expect(buildTimeAxis("09:00", "10:00", 30)).toEqual(["09:00", "09:30"]);
  });

  it("handles 15-min period", () => {
    const out = buildTimeAxis("14:00", "15:00", 15);
    expect(out).toEqual(["14:00", "14:15", "14:30", "14:45"]);
  });

  it("returns empty when start >= end", () => {
    expect(buildTimeAxis("14:00", "14:00", 30)).toEqual([]);
  });

  it("handles midnight crossing: 23:00 to 00:00 with 60-min period", () => {
    expect(buildTimeAxis("23:00", "00:00", 60)).toEqual(["23:00"]);
  });

  it("handles midnight crossing: 22:00 to 00:00 with 60-min period", () => {
    expect(buildTimeAxis("22:00", "00:00", 60)).toEqual(["22:00", "23:00"]);
  });
});

describe("buildDisplayAxis", () => {
  it("칠해진 셀이 없으면 buildTimeAxis와 동일하다", () => {
    expect(buildDisplayAxis(["09:00", "12:00"], 30, new Set())).toEqual(
      buildTimeAxis("09:00", "12:00", 30)
    );
  });

  it("범위보다 늦게 칠해진 셀을 포함하도록 축을 확장한다", () => {
    const painted = new Set(["2026-06-02_17:00"]);
    const axis = buildDisplayAxis(["09:00", "12:00"], 30, painted);
    expect(axis[0]).toBe("09:00");
    expect(axis).toContain("17:00");
  });

  it("범위보다 이르게 칠해진 셀도 포함한다", () => {
    const painted = new Set(["2026-06-02_07:00"]);
    const axis = buildDisplayAxis(["09:00", "12:00"], 30, painted);
    expect(axis[0]).toBe("07:00");
    expect(axis).toContain("11:30");
  });

  it("여러 날짜에 흩어진 셀을 모두 덮는다", () => {
    const painted = new Set(["2026-06-02_07:00", "2026-06-03_20:00"]);
    const axis = buildDisplayAxis(["09:00", "12:00"], 30, painted);
    expect(axis[0]).toBe("07:00");
    expect(axis).toContain("20:00");
  });

  it("확장 폭을 24시간으로 제한한다", () => {
    const painted = new Set(["2026-06-02_00:00", "2026-06-02_23:30"]);
    const axis = buildDisplayAxis(["09:00", "12:00"], 30, painted);
    expect(axis.length).toBeLessThanOrEqual(48);
  });
});

describe("timesOutsideRange", () => {
  it("범위 안에만 칠해져 있으면 빈 배열", () => {
    const painted = new Set(["2026-06-02_10:00"]);
    expect(timesOutsideRange(["09:00", "12:00"], 30, painted)).toEqual([]);
  });

  it("범위 밖 시각을 중복 없이 오름차순으로 돌려준다", () => {
    const painted = new Set([
      "2026-06-02_17:00",
      "2026-06-03_17:00", // 같은 시각, 다른 날짜 → 하나로 합쳐짐
      "2026-06-02_07:00",
      "2026-06-02_10:00", // 범위 안 → 제외
    ]);
    expect(timesOutsideRange(["09:00", "12:00"], 30, painted)).toEqual(["07:00", "17:00"]);
  });
});

/**
 * D2 회귀 방지 — 스펙 §7.
 * 이전에는 범위를 좁히면 화면에서 사라진 셀이 그대로 슬롯으로 저장됐다.
 * 표시 축이 항상 칠해진 셀을 덮으므로 이 상황이 구조적으로 불가능해야 한다.
 */
describe("표시 축과 저장될 슬롯의 일치 (D2 회귀)", () => {
  it("범위를 좁혀도 칠해진 모든 시각이 축에 남는다", () => {
    const painted = new Set(["2026-06-02_17:00", "2026-06-02_09:00"]);
    const axis = buildDisplayAxis(["09:00", "12:00"], 30, painted);
    for (const key of painted) {
      const hhmm = key.slice(key.indexOf("_") + 1);
      expect(axis).toContain(hhmm);
    }
  });
});
