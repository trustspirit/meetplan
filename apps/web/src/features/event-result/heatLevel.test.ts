import { describe, it, expect } from "vitest";
import { heatLevel } from "./heatLevel";

describe("heatLevel", () => {
  it("0%는 surface 배경에 흐린 글자", () => {
    expect(heatLevel(0)).toEqual({ bg: "bg-surface", fg: "text-text-subtle" });
  });

  it("낮은 비율은 옅은 브랜드 배경에 어두운 글자", () => {
    expect(heatLevel(0.2).bg).toBe("bg-brand-50");
    expect(heatLevel(0.2).fg).toBe("text-text");
    expect(heatLevel(0.4).bg).toBe("bg-brand-100");
  });

  it("50%를 넘으면 글자를 흰색으로 뒤집는다", () => {
    expect(heatLevel(0.6).fg).toBe("text-text");    // brand-300은 아직 밝다
    expect(heatLevel(0.8).fg).toBe("text-white");
    expect(heatLevel(1).fg).toBe("text-white");
  });

  it("100%는 가장 진한 브랜드 색", () => {
    expect(heatLevel(1).bg).toBe("bg-brand-600");
  });

  it("경계값에서 단계가 정확히 갈린다", () => {
    expect(heatLevel(0.25).bg).toBe("bg-brand-50");
    expect(heatLevel(0.26).bg).toBe("bg-brand-100");
    expect(heatLevel(0.5).bg).toBe("bg-brand-100");
    expect(heatLevel(0.51).bg).toBe("bg-brand-300");
    expect(heatLevel(0.75).bg).toBe("bg-brand-300");
    expect(heatLevel(0.76).bg).toBe("bg-brand-500");
    expect(heatLevel(0.99).bg).toBe("bg-brand-500");
  });
});
