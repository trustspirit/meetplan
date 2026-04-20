import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading)
        return _jsx("div", { className: "p-8 text-muted-foreground", children: "\uB85C\uB529\u2026" });
    if (!user)
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    return _jsx(_Fragment, { children: children });
}
