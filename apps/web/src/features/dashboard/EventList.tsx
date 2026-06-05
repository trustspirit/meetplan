import { Link } from "react-router-dom";
import type { MeetplanEvent } from "@meetplan/shared";
import { format, parseISO } from "date-fns";
import { t } from "@/lib/i18n";

export function EventList({ events }: { events: MeetplanEvent[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {events.map((ev) => (
        <li key={ev.id}>
          <Link
            to={`/events/${ev.id}/result`}
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
          >
            <div>
              <div className="font-medium">{ev.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('list.slotInfo', { slots: ev.slots.length, minutes: ev.periodMinutes })} ·{" "}
                {format(parseISO(ev.createdAt), "yyyy-MM-dd")}
              </div>
            </div>
            <StatusBadge status={ev.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: "open" | "closed" }) {
  const classes =
    status === "open"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-zinc-200 text-zinc-600";
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${classes}`}>
      {status === "open" ? t('list.statusOpen') : t('list.statusClosed')}
    </span>
  );
}
