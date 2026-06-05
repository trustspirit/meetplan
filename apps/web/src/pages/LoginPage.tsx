import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useAuth } from "@/features/auth/useAuth";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  if (loading) return <div className="p-8">{t('login.loading')}</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">
        <h1 className="text-3xl font-semibold">{t('app.name')}</h1>
        <p className="text-muted-foreground text-sm">{t('login.subtitle')}</p>
        <Button size="lg" onClick={signInWithGoogle}>{t('login.googleSignIn')}</Button>
        <div className="flex justify-center">
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
}
