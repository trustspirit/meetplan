import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isBefore, isSameMonth, startOfToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
export function MultiDateCalendar({ selectedDates, onToggleDate }) {
    const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
    const today = startOfToday();
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);
    return (_jsxs("div", { className: "rounded-xl border p-4 bg-background", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "font-semibold text-sm", children: format(viewMonth, "yyyy년 M월") }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { type: "button", onClick: () => setViewMonth((m) => addMonths(m, -1)), className: "w-7 h-7 rounded border inline-flex items-center justify-center hover:bg-muted", children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx("button", { type: "button", onClick: () => setViewMonth((m) => addMonths(m, 1)), className: "w-7 h-7 rounded border inline-flex items-center justify-center hover:bg-muted", children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "grid grid-cols-7 gap-0.5", children: [["일", "월", "화", "수", "목", "금", "토"].map((d) => (_jsx("div", { className: "text-[10px] text-muted-foreground text-center py-1 font-medium", children: d }, d))), days.map((day) => {
                        const ymd = format(day, "yyyy-MM-dd");
                        const past = isBefore(day, today);
                        const inMonth = isSameMonth(day, viewMonth);
                        const selected = selectedDates.includes(ymd);
                        return (_jsx("button", { type: "button", disabled: past, onClick: () => onToggleDate(ymd), className: cn("aspect-square rounded-md text-xs inline-flex items-center justify-center transition-colors", !inMonth && "text-muted-foreground/40", past && "text-muted-foreground/30 cursor-not-allowed", !past && !selected && "hover:bg-muted", selected && "bg-accent text-accent-foreground font-semibold"), children: format(day, "d") }, ymd));
                    })] }), selectedDates.length > 0 && (_jsxs("div", { className: "mt-3 pt-3 border-t text-[11px] text-muted-foreground", children: ["\uC120\uD0DD: ", _jsxs("span", { className: "text-foreground font-medium", children: [selectedDates.length, "\uC77C"] })] }))] }));
}
