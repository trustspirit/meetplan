import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    if (loading)
        return _jsx("div", { className: "p-8", children: "\uB85C\uB529\u2026" });
    if (user)
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-6", children: _jsxs("div", { className: "w-full max-w-sm flex flex-col gap-6 text-center", children: [_jsx("h1", { className: "text-3xl font-semibold", children: "MeetPlan" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "\uAC00\uB2A5\uD55C \uC2DC\uAC04\uC744 \uACF5\uC720\uD558\uACE0, \uC11C\uB85C \uC548 \uACB9\uCE58\uB294 1:1 \uC77C\uC815\uC744 \uCC3E\uC544\uBCF4\uC138\uC694." }), _jsx(Button, { size: "lg", onClick: signInWithGoogle, children: "Google\uB85C \uACC4\uC18D\uD558\uAE30" })] }) }));
}
