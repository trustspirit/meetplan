import { useState, useCallback } from "react";

export interface EventCreateState {
  title: string;
  periodMinutes: number;
  selectedDates: string[];
  dailyRange: [string, string];
  paintedCells: Set<string>;
}

const defaultInitialState: EventCreateState = {
  title: "",
  periodMinutes: 30,
  selectedDates: [],
  dailyRange: ["09:00", "18:00"],
  paintedCells: new Set(),
};

export function cellKey(dateYmd: string, hhmm: string): string {
  return `${dateYmd}_${hhmm}`;
}
export function parseCellKey(key: string): { dateYmd: string; hhmm: string } {
  const idx = key.indexOf("_");
  if (idx < 1 || idx === key.length - 1) {
    throw new Error(`Invalid cell key format: "${key}"`);
  }
  return { dateYmd: key.slice(0, idx), hhmm: key.slice(idx + 1) };
}

export function useEventCreateState(initial?: Partial<EventCreateState>) {
  const [state, setState] = useState<EventCreateState>({
    ...defaultInitialState,
    ...initial,
    // Set and arrays are cloned to keep independent instances
    paintedCells: new Set(initial?.paintedCells ?? defaultInitialState.paintedCells),
    selectedDates: [...(initial?.selectedDates ?? defaultInitialState.selectedDates)],
    dailyRange: initial?.dailyRange
      ? ([...initial.dailyRange] as [string, string])
      : ([...defaultInitialState.dailyRange] as [string, string]),
  });

  const setTitle = useCallback((title: string) => setState((s) => ({ ...s, title })), []);
  const setPeriod = useCallback(
    (periodMinutes: number) => setState((s) => ({ ...s, periodMinutes })),
    []
  );

  const toggleDate = useCallback((dateYmd: string) => {
    setState((s) => {
      if (s.selectedDates.includes(dateYmd)) {
        const newDates = s.selectedDates.filter((d) => d !== dateYmd);
        const newCells = new Set<string>();
        s.paintedCells.forEach((k) => {
          if (!k.startsWith(`${dateYmd}_`)) newCells.add(k);
        });
        return { ...s, selectedDates: newDates, paintedCells: newCells };
      }
      const newDates = [...s.selectedDates, dateYmd].sort();
      return { ...s, selectedDates: newDates };
    });
  }, []);

  const setDailyRange = useCallback(
    (range: [string, string]) => setState((s) => ({ ...s, dailyRange: range })),
    []
  );

  const setCellPainted = useCallback((key: string, on: boolean) => {
    setState((s) => {
      const next = new Set(s.paintedCells);
      if (on) next.add(key);
      else next.delete(key);
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
