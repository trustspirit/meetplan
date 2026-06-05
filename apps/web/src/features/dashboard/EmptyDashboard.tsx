import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { t } from "@/lib/i18n";

export function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <CalendarPlus className="w-8 sm:w-12 h-8 sm:h-12 text-muted-foreground/40" />
      <h2 className="text-lg sm:text-xl font-semibold">{t('dashboard.emptyTitle')}</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        {t('dashboard.emptyDesc')}
      </p>
      <Link to="/events/new">
        <Button size="lg">{t('dashboard.createFirst')}</Button>
      </Link>
    </div>
  );
}
