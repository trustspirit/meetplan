interface Props {
    selectedDates: string[];
    dailyRange: [string, string];
    periodMinutes: number;
    paintedCells: Set<string>;
    onSetCell: (key: string, on: boolean) => void;
    onChangeRange: (range: [string, string]) => void;
}
export declare function TimePainter({ selectedDates, dailyRange, periodMinutes, paintedCells, onSetCell, onChangeRange, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TimePainter.d.ts.map