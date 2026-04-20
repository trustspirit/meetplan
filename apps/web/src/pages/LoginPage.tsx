import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  if (loading) return <div className="p-8">로딩…</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">
        <h1 className="text-3xl font-semibold">MeetPlan</h1>
        <p className="text-muted-foreground text-sm">
          가능한 시간을 공유하고, 서로 안 겹치는 1:1 일정을 찾아보세요.
        </p>
        <Button size="lg" onClick={signInWithGoogle}>Google로 계속하기</Button>
      </div>
    </div>
  );
}
