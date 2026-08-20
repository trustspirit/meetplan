import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import type { MeetplanEvent } from "@meetplan/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

export function EventList({ events }: { events: MeetplanEvent[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {events.map((ev) => (
        <li key={ev.id}>
          <Card className="transition-colors hover:border-border-strong hover:bg-surface-subtle">
            <Link
              to={`/events/${ev.id}/result`}
              className="flex min-h-touch items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text">{ev.title}</div>
                <div className="mt-1 text-2xs text-text-muted">
                  {ev.eventType === "ward_visit"
                    ? t('eventType.wardVisit')
                    : t('list.slotInfo', { slots: ev.slots.length, minutes: ev.periodMinutes })}
                  {" · "}
                  {format(parseISO(ev.createdAt), "yyyy-MM-dd")}
                </div>
              </div>
              <Badge tone={ev.status === "open" ? "success" : "neutral"} dot>
                {ev.status === "open" ? t('list.statusOpen') : t('list.statusClosed')}
              </Badge>
              <ChevronRight size={16} className="shrink-0 text-text-subtle" aria-hidden />
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}
