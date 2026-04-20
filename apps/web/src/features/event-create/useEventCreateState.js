import { useState, useCallback } from "react";
const initialState = {
    title: "",
    periodMinutes: 30,
    selectedDates: [],
    dailyRange: ["09:00", "18:00"],
    paintedCells: new Set(),
};
export function cellKey(dateYmd, hhmm) {
    return `${dateYmd}_${hhmm}`;
}
export function parseCellKey(key) {
    const [dateYmd, hhmm] = key.split("_");
    return { dateYmd: dateYmd, hhmm: hhmm };
}
export function useEventCreateState() {
    const [state, setState] = useState(initialState);
    const setTitle = useCallback((title) => setState((s) => ({ ...s, title })), []);
    const setPeriod = useCallback((periodMinutes) => setState((s) => ({ ...s, periodMinutes })), []);
    const toggleDate = useCallback((dateYmd) => {
        setState((s) => {
            if (s.selectedDates.includes(dateYmd)) {
                const newDates = s.selectedDates.filter((d) => d !== dateYmd);
                const newCells = new Set();
                s.paintedCells.forEach((k) => {
                    if (!k.startsWith(`${dateYmd}_`))
                        newCells.add(k);
                });
                return { ...s, selectedDates: newDates, paintedCells: newCells };
            }
            const newDates = [...s.selectedDates, dateYmd].sort();
            return { ...s, selectedDates: newDates };
        });
    }, []);
    const setDailyRange = useCallback((range) => setState((s) => ({ ...s, dailyRange: range })), []);
    const setCellPainted = useCallback((key, on) => {
        setState((s) => {
            const next = new Set(s.paintedCells);
            if (on)
                next.add(key);
            else
                next.delete(key);
            return { ...s, paintedCells: next };
        });
    }, []);
    return {
        state,
        setTitle,
        setPeriod,
        toggleDate,
        setDailyRange,
        setCellPainted,
    };
}
