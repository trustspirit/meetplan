import { Link, NavLink } from "react-router-dom";
import { LogOut, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useAuth } from "@/features/auth/useAuth";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * 인증된 페이지 전역에 걸리는 상단 바.
 * 목적지가 둘뿐이므로 사이드바 대신 앱바를 쓴다 (스펙 §5).
 */
export function AppBar() {
  const { user, signOutUser } = useAuth();

  const accountItems: MenuItem[] = [
    { icon: <LogOut size={14} aria-hidden />, label: t('dashboard.signOut'), onClick: signOutUser },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 rounded-md text-base font-bold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CalendarDays size={18} className="text-primary" aria-hidden />
          {t('app.name')}
        </Link>

        <nav className="ml-4 hidden sm:block">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                isActive ? "font-semibold text-text" : "text-text-muted hover:text-text"
              )
            }
          >
            {t('nav.myEvents')}
          </NavLink>
        </nav>

        <div className="flex-1" />

        <Link to="/events/new" className="hidden sm:block">
          <Button size="sm">
            <Plus size={14} className="mr-1.5" aria-hidden />
            {t('nav.newEvent')}
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden max-w-[160px] truncate text-xs text-text-muted md:inline">
            {user?.email}
          </span>
          <LanguageToggle />
          <Menu items={accountItems} label={t('nav.account')} />
        </div>
      </div>
    </header>
  );
}
