import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useMyEvents } from "./useMyEvents";
import { EventList } from "./EventList";
import { EmptyDashboard } from "./EmptyDashboard";
export default function DashboardPage() {
    const { user, signOutUser } = useAuth();
    const events = useMyEvents();
    return (_jsxs("div", { className: "max-w-3xl mx-auto px-6 py-10", children: [_jsxs("header", { className: "flex items-center justify-between mb-10", children: [_jsx("h1", { className: "text-xl font-semibold", children: "MeetPlan" }), _jsxs("div", { className: "flex items-center gap-3 text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: user?.email }), _jsx(Button, { variant: "ghost", size: "sm", onClick: signOutUser, children: "\uB85C\uADF8\uC544\uC6C3" })] })] }), events === null ? (_jsx("div", { className: "text-muted-foreground py-24 text-center", children: "\uB85C\uB529 \uC911\u2026" })) : events.length === 0 ? (_jsx(EmptyDashboard, {})) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "\uB0B4 \uC774\uBCA4\uD2B8" }), _jsx(Link, { to: "/events/new", children: _jsx(Button, { children: "+ \uC0C8 \uC774\uBCA4\uD2B8" }) })] }), _jsx(EventList, { events: events })] }))] }));
}
