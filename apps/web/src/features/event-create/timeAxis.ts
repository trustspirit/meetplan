export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
}

export function toHHmm(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** [startMin, endMin) 구간을 periodMinutes 간격으로 자른다. endMin은 startMin보다 클 수 있다(익일 포함). */
function axisFromMinutes(startMin: number, endMin: number, periodMinutes: number): string[] {
  const out: string[] = [];
  for (let t = startMin; t + periodMinutes <= endMin; t += periodMinutes) {
    out.push(toHHmm(t));
  }
  return out;
}

export function buildTimeAxis(startHHmm: string, endHHmm: string, periodMinutes: number): string[] {
  const startMin = toMin(startHHmm);
  // "00:00" as end (or any end < start) means next-day midnight.
  let endMin = toMin(endHHmm);
  if (endMin < startMin) endMin += 1440;
  return axisFromMinutes(startMin, endMin, periodMinutes);
}

/** 셀 키 "YYYY-MM-DD_HH:mm" 에서 HH:mm 부분만 뽑는다. 형식이 어긋나면 null. */
function cellTime(key: string): string | null {
  const idx = key.indexOf("_");
  if (idx < 1 || idx === key.length - 1) return null;
  return key.slice(idx + 1);
}

/** 사용자가 지정한 표시 구간을 분 단위 [start, end)로 정규화한다. */
function normalizeRange(range: [string, string]): [number, number] {
  const startMin = toMin(range[0]);
  let endMin = toMin(range[1]);
  if (endMin <= startMin) endMin += 1440;
  return [startMin, endMin];
}

/**
 * 표시할 시간축을 만든다.
 *
 * dailyRange는 데이터가 아니라 "표시 창"이다. 사용자가 창을 좁혀도 이미 칠해진 셀은
 * 절대 숨기지 않는다 — 숨기면 화면에 없는 슬롯이 그대로 저장되기 때문이다(스펙 §7 D2).
 * 따라서 칠해진 셀의 시각을 모두 덮도록 축을 자동 확장한다.
 */
export function buildDisplayAxis(
  range: [string, string],
  periodMinutes: number,
  paintedCells: Set<string>
): string[] {
  let [startMin, endMin] = normalizeRange(range);

  for (const key of paintedCells) {
    const hhmm = cellTime(key);
    if (hhmm === null) continue;
    const cellMin = toMin(hhmm);
    if (cellMin < startMin) startMin = cellMin;
    if (cellMin + periodMinutes > endMin) endMin = cellMin + periodMinutes;
  }

  // 하루를 넘겨 확장되는 일은 없어야 한다 (셀 시각은 항상 00:00~23:59 범위).
  if (endMin - startMin > 1440) endMin = startMin + 1440;

  return axisFromMinutes(startMin, endMin, periodMinutes);
}

/**
 * 사용자가 지정한 표시 구간 밖에 칠해진 시각들. 중복 제거, 오름차순.
 * 비어 있지 않으면 축이 자동 확장됐다는 뜻이므로 UI가 안내를 띄운다.
 */
export function timesOutsideRange(
  range: [string, string],
  periodMinutes: number,
  paintedCells: Set<string>
): string[] {
  const [startMin, endMin] = normalizeRange(range);
  const outside = new Set<string>();

  for (const key of paintedCells) {
    const hhmm = cellTime(key);
    if (hhmm === null) continue;
    const cellMin = toMin(hhmm);
    if (cellMin < startMin || cellMin + periodMinutes > endMin) {
      outside.add(hhmm);
    }
  }

  return [...outside].sort();
}
