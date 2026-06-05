import { useState, useRef, useEffect } from "react";
import { CalendarPlus, Settings, Check, AlertCircle } from "lucide-react";
import type { Matching, Slot } from "@meetplan/shared";
import { Button } from "@/components/ui/button";
import { useGoogleCalendarWrite, type GCalEventInput } from "./useGoogleCalendarWrite";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  selectedMatching: Matching;
  slots: Slot[];
  eventTitle: string;
  eventDescription?: string | undefined;
  participantNameById: Record<string, string>;
}

type Status = "idle" | "connecting" | "creating" | "success" | "error";

export function CalendarSyncPanel({
  selectedMatching,
  slots,
  eventTitle,
  eventDescription,
  participantNameById,
}: Props) {
  const {
    connected,
    connecting,
    connectError,
    calendarList,
    selectedCalendarId,
    setSelectedCalendarId,
    connect,
    createEvents,
    creating,
  } = useGoogleCalendarWrite();

  const [status, setStatus] = useState<Status>("idle");
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [settingsOpen]);

  const assignmentCount = Object.keys(selectedMatching.assignments).length;

  const handleAdd = async () => {
    setResultMsg(null);
    setStatus("connecting");

    if (!connected) {
      const ok = await connect();
      if (!ok) { setStatus("idle"); return; }
    }

    const events: GCalEventInput[] = Object.entries(selectedMatching.assignments).flatMap(
      ([pid, slotId]) => {
        const slot = slots.find((s) => s.id === slotId);
        if (!slot) return [];
        return [{
          summary: `${eventTitle} - ${participantNameById[pid] ?? pid}`,
          ...(eventDescription ? { description: eventDescription } : {}),
          start: slot.start,
          end: slot.end,
        }];
      }
    );

    setStatus("creating");
    const { created, error } = await createEvents(events);

    if (error && created === 0) {
      setStatus("error");
      setResultMsg(error);
    } else {
      setStatus("success");
      setResultMsg(t("gcal.added", { n: created }));
      setTimeout(() => { setStatus("idle"); setResultMsg(null); }, 3000);
    }
  };

  const isLoading = status === "connecting" || status === "creating" || connecting || creating;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {status === "success" && resultMsg && (
        <span className="flex items-center gap-1 text-xs text-emerald-600 whitespace-nowrap">
          <Check size={12} />
          {resultMsg}
        </span>
      )}
      {status === "error" && resultMsg && (
        <span className="flex items-center gap-1 text-xs text-destructive whitespace-nowrap">
          <AlertCircle size={12} />
          {resultMsg}
        </span>
      )}

      <Button
        size="sm"
        variant="outline"
        className="text-xs h-8 px-2.5 gap-1.5"
        onClick={handleAdd}
        disabled={isLoading || assignmentCount === 0}
      >
        <CalendarPlus size={13} />
        {isLoading ? t("gcal.adding") : t("gcal.addToCalendar")}
      </Button>

      <div className="relative" ref={settingsRef}>
        <button
          type="button"
          title={t("gcal.settings")}
          onClick={() => setSettingsOpen((v) => !v)}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md border border-border",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
            settingsOpen && "bg-muted/50 text-foreground"
          )}
        >
          <Settings size={13} />
        </button>

        {settingsOpen && (
          <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-lg border bg-background shadow-md p-3 flex flex-col gap-2.5">
            <div className="text-xs font-semibold text-muted-foreground">{t("gcal.settings")}</div>

            {!connected ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8"
                onClick={async () => { await connect(); }}
                disabled={connecting}
              >
                {connecting ? "…" : t("gcal.connectAccount")}
              </Button>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">{t("gcal.selectCalendar")}</label>
                <select
                  className="w-full rounded-md border border-border bg-background text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selectedCalendarId ?? ""}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
                >
                  {calendarList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.summary}{c.primary ? ` ${t("calendar.primary")}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {connectError && (
              <p className="text-xs text-destructive">{connectError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
