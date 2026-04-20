export function buildTimeAxis(startHHmm: string, endHHmm: string, periodMinutes: number): string[] {
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h! * 60 + m!;
  };
  const toHHmm = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  const startMin = toMin(startHHmm);
  const endMin = toMin(endHHmm);
  const out: string[] = [];
  for (let t = startMin; t + periodMinutes <= endMin; t += periodMinutes) {
    out.push(toHHmm(t));
  }
  return out;
}
