import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { t } from "@/lib/i18n";

/** 로그인 없이 접근하는 응답 페이지(/e/:eventId)용 셸. 네비게이션이 없다. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4 sm:px-6">
          <span className="flex items-center gap-1.5 text-base font-bold text-text">
            <CalendarDays size={18} className="text-primary" aria-hidden />
            {t('app.name')}
          </span>
          <div className="flex-1" />
          <LanguageToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
