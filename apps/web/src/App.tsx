import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import EventCreatePage from "@/features/event-create/EventCreatePage";
import EventResultPage from "@/features/event-result/EventResultPage";
import RespondPage from "@/features/event-respond/RespondPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/e/:eventId" element={<RespondPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/new"
          element={
            <ProtectedRoute>
              <EventCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:eventId/result"
          element={
            <ProtectedRoute>
              <EventResultPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
