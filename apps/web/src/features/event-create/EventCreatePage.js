import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BasicInfoForm } from "./BasicInfoForm";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { TimePainter } from "./TimePainter";
import { useEventCreateState } from "./useEventCreateState";
export default function EventCreatePage() {
    const { state, setTitle, setPeriod, toggleDate, setDailyRange, setCellPainted, } = useEventCreateState();
    return (_jsxs("div", { className: "max-w-6xl mx-auto px-6 py-8", children: [_jsxs("header", { className: "flex items-center justify-between pb-6 border-b", children: [_jsx(Link, { to: "/dashboard", className: "text-sm hover:underline", children: "\u2190 \uB3CC\uC544\uAC00\uAE30" }), _jsx("h1", { className: "font-semibold", children: "\uC0C8 \uC774\uBCA4\uD2B8 \uB9CC\uB4E4\uAE30" }), _jsx(Button, { disabled: true, children: "\uC0DD\uC131 (\uB2E4\uC74C Task)" })] }), _jsxs("div", { className: "py-8 flex flex-col gap-10", children: [_jsx(BasicInfoForm, { title: state.title, onTitleChange: setTitle, periodMinutes: state.periodMinutes, onPeriodChange: setPeriod }), _jsxs("section", { className: "grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start", children: [_jsx(MultiDateCalendar, { selectedDates: state.selectedDates, onToggleDate: toggleDate }), _jsx(TimePainter, { selectedDates: state.selectedDates, dailyRange: state.dailyRange, periodMinutes: state.periodMinutes, paintedCells: state.paintedCells, onSetCell: setCellPainted, onChangeRange: setDailyRange })] })] })] }));
}
