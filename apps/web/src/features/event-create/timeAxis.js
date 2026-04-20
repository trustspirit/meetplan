export function buildTimeAxis(startHHmm, endHHmm, periodMinutes) {
    const toMin = (hhmm) => {
        const [h, m] = hhmm.split(":").map(Number);
        return h * 60 + m;
    };
    const toHHmm = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    const startMin = toMin(startHHmm);
    const endMin = toMin(endHHmm);
    const out = [];
    for (let t = startMin; t + periodMinutes <= endMin; t += periodMinutes) {
        out.push(toHHmm(t));
    }
    return out;
}
