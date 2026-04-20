import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
export function EventList({ events }) {
    return (_jsx("ul", { className: "flex flex-col gap-2", children: events.map((ev) => (_jsx("li", { children: _jsxs(Link, { to: `/events/${ev.id}/result`, className: "flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: ev.title }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [ev.slots.length, "\uAC1C \uC2AC\uB86F \u00B7 ", ev.periodMinutes, "\uBD84 \u00B7", " ", format(parseISO(ev.createdAt), "yyyy-MM-dd")] })] }), _jsx(StatusBadge, { status: ev.status })] }) }, ev.id))) }));
}
function StatusBadge({ status }) {
    const classes = status === "open"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-zinc-200 text-zinc-600";
    const text = status === "open" ? "진행 중" : "마감됨";
    return (_jsx("span", { className: `text-xs font-medium px-2.5 py-1 rounded-full ${classes}`, children: text }));
}
