import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import EventCreatePage from "@/features/event-create/EventCreatePage";
import EventResultStub from "@/pages/EventResultStub";
export default function App() {
    return (_jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/events/new", element: _jsx(ProtectedRoute, { children: _jsx(EventCreatePage, {}) }) }), _jsx(Route, { path: "/events/:eventId/result", element: _jsx(ProtectedRoute, { children: _jsx(EventResultStub, {}) }) })] }) }));
}
