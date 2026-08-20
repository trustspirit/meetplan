import { Link } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n";

export function EmptyDashboard() {
  return (
    <EmptyState
      icon={<CalendarPlus size={40} aria-hidden />}
      title={t('dashboard.emptyTitle')}
      description={t('dashboard.emptyDesc')}
      action={
        <Link to="/events/new">
          <Button size="lg">{t('dashboard.createFirst')}</Button>
        </Link>
      }
    />
  );
}
