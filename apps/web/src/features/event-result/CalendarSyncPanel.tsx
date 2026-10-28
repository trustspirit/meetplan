import { useState, useRef, useEffect, useCallback } from "react";
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

type Status = "idle" | "connecting" | "creating" | "success" | "partial" | "error";

const RESULT_RESET_MS = 3000;

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
    getSelectedCalendarId,
    connect,
    createEvents,
    creating,
  } = useGoogleCalendarWrite();

  const [status, setStatus] = useState<Status>("idle");
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  // `${calendarId}|${eventKey}` of events added this session — re-clicking only adds what's missing
  const [addedKeys, setAddedKeys] = useState<Set<string>>(() => new Set());
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = null;
  }, []);

  useEffect(() => clearResetTimer, [clearResetTimer]);

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

  const events: GCalEventInput[] = Object.entries(selectedMatching.assignments).flatMap(
    ([pid, slotId]) => {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return [];
      return [{
        key: `${pid}:${slotId}`,
        summary: `${eventTitle} - ${participantNameById[pid] ?? pid}`,
        ...(eventDescription ? { description: eventDescription } : {}),
        start: slot.start,
        end: slot.end,
      }];
    }
  );

  const allAdded =
    connected &&
    selectedCalendarId !== null &&
    events.length > 0 &&
    events.every((ev) => addedKeys.has(`${selectedCalendarId}|${ev.key}`));

  const handleAdd = async () => {
    clearResetTimer();
    setResultMsg(null);
    setStatus("connecting");

    if (!connected) {
      const { ok, error } = await connect();
      if (!ok) {
        // error is null when the user just closed the popup
        setStatus(error ? "error" : "idle");
        setResultMsg(error);
        return;
      }
    }

    const targetId = getSelectedCalendarId();
    const pending = events.filter((ev) => !addedKeys.has(`${targetId}|${ev.key}`));

    setStatus("creating");
    const { calendarId, createdKeys, error } = await createEvents(pending);

    if (createdKeys.length > 0) {
      setAddedKeys((prev) => {
        const next = new Set(prev);
        for (const k of createdKeys) next.add(`${calendarId}|${k}`);
        return next;
      });
    }

    if (error) {
      setStatus(createdKeys.length > 0 ? "partial" : "error");
      setResultMsg(
        createdKeys.length > 0
          ? `${t("gcal.added", { n: createdKeys.length })} · ${error}`
          : error
      );
      return;
    }

    setStatus("success");
    setResultMsg(t("gcal.added", { n: createdKeys.length }));
    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null;
      setStatus("idle");
      setResultMsg(null);
    }, RESULT_RESET_MS);
  };

  const isLoading = status === "connecting" || status === "creating" || connecting || creating;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {status === "success" && resultMsg && (
        <span className="flex items-center gap-1 text-xs text-success whitespace-nowrap">
          <Check size={12} />
          {resultMsg}
        </span>
      )}
      {(status === "error" || status === "partial") && resultMsg && (
        <span
          className={cn(
            "flex items-center gap-1 text-xs whitespace-nowrap",
            status === "partial" ? "text-warning" : "text-danger"
          )}
        >
          <AlertCircle size={12} />
          {resultMsg}
        </span>
      )}

      <Button
        size="sm"
        variant="secondary"
        className="text-xs h-8 px-2.5 gap-1.5"
        onClick={handleAdd}
        disabled={isLoading || events.length === 0 || allAdded}
      >
        {allAdded ? <Check size={13} /> : <CalendarPlus size={13} />}
        {isLoading ? t("gcal.adding") : allAdded ? t("gcal.allAdded") : t("gcal.addToCalendar")}
      </Button>

      <div className="relative" ref={settingsRef}>
        <button
          type="button"
          title={t("gcal.settings")}
          onClick={() => setSettingsOpen((v) => !v)}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md border border-border",
            "text-text-muted hover:text-text hover:bg-surface-subtle/50 transition-colors",
            settingsOpen && "bg-surface-subtle text-text"
          )}
        >
          <Settings size={13} />
        </button>

        {settingsOpen && (
          <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-lg border bg-surface shadow-md p-3 flex flex-col gap-2.5">
            <div className="text-xs font-semibold text-text-muted">{t("gcal.settings")}</div>

            {!connected ? (
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-xs h-8"
                onClick={async () => { await connect(); }}
                disabled={connecting}
              >
                {connecting ? "…" : t("gcal.connectAccount")}
              </Button>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted">{t("gcal.selectCalendar")}</label>
                <select
                  className="w-full rounded-md border border-border bg-surface text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
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
              <p className="text-xs text-danger">{connectError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
