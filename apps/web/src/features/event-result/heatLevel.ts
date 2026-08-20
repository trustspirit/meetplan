export interface HeatStyle {
  /** 셀 배경 Tailwind 클래스 */
  bg: string;
  /** 그 배경 위에서 AA 대비를 만족하는 글자색 클래스 */
  fg: string;
}

/**
 * 응답 비율(0~1)을 브랜드 농도 램프로 변환한다 (스펙 §8.4).
 * brand-500 이상부터는 배경이 어두워 글자를 흰색으로 뒤집는다.
 */
export function heatLevel(ratio: number): HeatStyle {
  if (ratio <= 0) return { bg: "bg-surface", fg: "text-text-subtle" };
  if (ratio <= 0.25) return { bg: "bg-brand-50", fg: "text-text" };
  if (ratio <= 0.5) return { bg: "bg-brand-100", fg: "text-text" };
  if (ratio <= 0.75) return { bg: "bg-brand-300", fg: "text-text" };
  if (ratio < 1) return { bg: "bg-brand-500", fg: "text-white" };
  return { bg: "bg-brand-600", fg: "text-white" };
}
