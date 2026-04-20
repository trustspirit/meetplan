export interface EventCreateState {
    title: string;
    periodMinutes: number;
    selectedDates: string[];
    dailyRange: [string, string];
    paintedCells: Set<string>;
}
export declare function cellKey(dateYmd: string, hhmm: string): string;
export declare function parseCellKey(key: string): {
    dateYmd: string;
    hhmm: string;
};
export declare function useEventCreateState(): {
    state: EventCreateState;
    setTitle: (title: string) => void;
    setPeriod: (periodMinutes: number) => void;
    toggleDate: (dateYmd: string) => void;
    setDailyRange: (range: [string, string]) => void;
    setCellPainted: (key: string, on: boolean) => void;
};
//# sourceMappingURL=useEventCreateState.d.ts.map