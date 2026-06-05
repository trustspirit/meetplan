export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
}

export function toHHmm(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function buildTimeAxis(startHHmm: string, endHHmm: string, periodMinutes: number): string[] {
  const startMin = toMin(startHHmm);
  // "00:00" as end (or any end < start) means next-day midnight.
  let endMin = toMin(endHHmm);
  if (endMin < startMin) endMin += 1440;
  const out: string[] = [];
  for (let t = startMin; t + periodMinutes <= endMin; t += periodMinutes) {
    out.push(toHHmm(t));
  }
  return out;
}
