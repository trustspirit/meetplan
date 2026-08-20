import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useMyEvents } from "./useMyEvents";
import { EventList } from "./EventList";
import { EmptyDashboard } from "./EmptyDashboard";
import { t } from "@/lib/i18n";

export default function DashboardPage() {
  const events = useMyEvents();

  return (
    <AppShell>
      <PageHeader
        title={t('dashboard.myEvents')}
        subtitle={t('dashboard.subtitle')}
        primaryAction={
          // 앱바의 "새 이벤트"는 데스크탑 전용이므로 모바일에서는 여기가 유일한 진입점이다.
          <Link to="/events/new" className="sm:hidden">
            <Button size="sm">
              <Plus size={14} className="mr-1.5" aria-hidden />
              {t('nav.newEvent')}
            </Button>
          </Link>
        }
      />

      {events === null ? (
        <PageSkeleton variant="list" />
      ) : events.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <EventList events={events} />
      )}
    </AppShell>
  );
}
