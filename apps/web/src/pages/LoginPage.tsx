import { Navigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useAuth } from "@/features/auth/useAuth";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  if (loading) return <div className="p-8 text-sm text-text-muted">{t('login.loading')}</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-full items-center justify-center bg-bg p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-2">
          <CalendarDays size={28} className="text-primary" aria-hidden />
          <h1 className="text-xl font-semibold text-text">{t('app.name')}</h1>
        </div>
        <p className="text-sm text-text-muted">{t('login.subtitle')}</p>
        <Button size="lg" className="w-full" onClick={signInWithGoogle}>
          {t('login.googleSignIn')}
        </Button>
        <LanguageToggle />
      </div>
    </div>
  );
}
