import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
export function EmptyDashboard() {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-24 gap-4", children: [_jsx(CalendarPlus, { className: "w-12 h-12 text-muted-foreground/40" }), _jsx("h2", { className: "text-xl font-semibold", children: "\uC544\uC9C1 \uC774\uBCA4\uD2B8\uAC00 \uC5C6\uC5B4\uC694" }), _jsx("p", { className: "text-sm text-muted-foreground max-w-sm", children: "\uAC00\uB2A5\uD55C \uC2DC\uAC04\uC744 \uACF5\uC720\uD558\uACE0 \uCC38\uAC00\uC790\uB4E4\uC758 \uC751\uB2F5\uC744 \uBAA8\uC544\uBCF4\uC138\uC694." }), _jsx(Link, { to: "/events/new", children: _jsx(Button, { size: "lg", children: "+ \uCCAB \uC774\uBCA4\uD2B8 \uB9CC\uB4E4\uAE30" }) })] }));
}
