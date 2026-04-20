import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { cellKey } from "./useEventCreateState";
import { buildTimeAxis } from "./timeAxis";
export function TimePainter({ selectedDates, dailyRange, periodMinutes, paintedCells, onSetCell, onChangeRange, }) {
    const axis = buildTimeAxis(dailyRange[0], dailyRange[1], periodMinutes);
    const painting = useRef(null);
    if (selectedDates.length === 0) {
        return (_jsx("div", { className: "rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background", children: "\uC67C\uCABD \uCE98\uB9B0\uB354\uC5D0\uC11C \uB0A0\uC9DC\uB97C \uBA3C\uC800 \uC120\uD0DD\uD558\uC138\uC694" }));
    }
    const handlePointerDown = (key, currentlyOn, e) => {
        e.target.setPointerCapture(e.pointerId);
        painting.current = { targetState: !currentlyOn };
        onSetCell(key, !currentlyOn);
    };
    const handlePointerEnter = (key) => {
        if (painting.current)
            onSetCell(key, painting.current.targetState);
    };
    const handlePointerUp = () => {
        painting.current = null;
    };
    return (_jsxs("div", { className: "rounded-xl border p-4 bg-background", onPointerUp: handlePointerUp, onPointerCancel: handlePointerUp, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "text-sm font-semibold", children: "\uAC00\uC6A9 \uC2DC\uAC04 \uD398\uC778\uD305" }), _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx("input", { type: "time", value: dailyRange[0], onChange: (e) => onChangeRange([e.target.value, dailyRange[1]]), className: "border rounded px-2 py-1 w-24" }), _jsx("span", { children: "\u2013" }), _jsx("input", { type: "time", value: dailyRange[1], onChange: (e) => onChangeRange([dailyRange[0], e.target.value]), className: "border rounded px-2 py-1 w-24" })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("div", { className: "grid gap-0.5", style: {
                        gridTemplateColumns: `40px repeat(${selectedDates.length}, minmax(56px, 1fr))`,
                        minWidth: `${40 + selectedDates.length * 56}px`,
                    }, children: [_jsx("div", {}), selectedDates.map((ymd) => (_jsxs("div", { className: "text-center text-[11px] font-semibold text-foreground py-1", children: [_jsx("span", { className: "block text-[9px] text-muted-foreground uppercase mb-0.5", children: format(parseISO(ymd), "EEE") }), format(parseISO(ymd), "M/d")] }, ymd))), axis.map((hhmm) => (_jsx(TimeRow, { hhmm: hhmm, dates: selectedDates, paintedCells: paintedCells, onPointerDown: handlePointerDown, onPointerEnter: handlePointerEnter }, hhmm)))] }) }), _jsx("p", { className: "text-[11px] text-muted-foreground mt-3", children: "\uD83D\uDCA1 \uD074\uB9AD\uD558\uAC70\uB098 \uB4DC\uB798\uADF8\uD574\uC11C \uAC00\uB2A5\uD55C \uC2DC\uAC04\uC744 \uCE60\uD558\uC138\uC694." })] }));
}
function TimeRow({ hhmm, dates, paintedCells, onPointerDown, onPointerEnter, }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-right pr-1 text-[10px] text-muted-foreground leading-[22px] tabular-nums", children: hhmm }), dates.map((ymd) => {
                const key = cellKey(ymd, hhmm);
                const on = paintedCells.has(key);
                return (_jsx("div", { role: "gridcell", "aria-label": `${ymd} ${hhmm}`, "aria-selected": on, onPointerDown: (e) => onPointerDown(key, on, e), onPointerEnter: () => onPointerEnter(key), className: cn("h-[22px] rounded-sm cursor-pointer select-none transition-colors", on ? "bg-accent" : "bg-muted hover:bg-muted-foreground/20") }, key));
            })] }));
}
