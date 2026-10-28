import { useState, useCallback, useRef } from "react";
import { connectGoogleCalendar, type CalendarListItem } from "@/lib/googleCalendar";
import { t } from "@/lib/i18n";

export interface GCalEventInput {
  key: string;   // stable identity within a matching, used to skip already-added events
  summary: string;
  description?: string;
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

export interface ConnectResult {
  ok: boolean;
  error: string | null; // null with ok=false means the user cancelled the popup
}

export interface CreateEventsResult {
  calendarId: string | null;
  createdKeys: string[];
  failed: number;
  error: string | null;
}

const STORAGE_KEY = "meetplan-gcal-write-id";
const MAX_CONCURRENT_REQUESTS = 4;
const TOKEN_EXPIRED = "TOKEN_EXPIRED";

function readStoredCalendarId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

async function settleWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<PromiseSettledResult<void>[]> {
  const results: PromiseSettledResult<void>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        await fn(items[i]!);
        results[i] = { status: "fulfilled", value: undefined };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export function useGoogleCalendarWrite() {
  const accessTokenRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [calendarList, setCalendarList] = useState<CalendarListItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarIdState] = useState<string | null>(readStoredCalendarId);
  // Mirrors selectedCalendarId so createEvents sees a calendar picked by connect() in the same click
  const selectedCalendarIdRef = useRef<string | null>(selectedCalendarId);
  const [creating, setCreating] = useState(false);

  const setSelectedCalendarId = useCallback((id: string) => {
    selectedCalendarIdRef.current = id;
    setSelectedCalendarIdState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    setConnecting(true);
    setConnectError(null);

    try {
      // calendar.events alone does not permit calendarList.list
      const conn = await connectGoogleCalendar(
        ["calendar.events", "calendar.calendarlist.readonly"],
        "writer"
      );
      if (!conn) return { ok: false, error: null };
      const { token, items } = conn;

      setCalendarList(items);
      accessTokenRef.current = token;
      setConnected(true);

      // Select stored calendar if still valid, otherwise fall back to primary
      const storedId = readStoredCalendarId();
      if (!storedId || !items.some((c) => c.id === storedId)) {
        const fallback = items.find((c) => c.primary)?.id ?? items[0]?.id ?? null;
        if (fallback) {
          setSelectedCalendarId(fallback);
        } else {
          selectedCalendarIdRef.current = null;
          setSelectedCalendarIdState(null);
        }
      }
      return { ok: true, error: null };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : t("gcal.unknownError");
      setConnectError(error);
      return { ok: false, error };
    } finally {
      setConnecting(false);
    }
  }, [setSelectedCalendarId]);

  const createEvents = useCallback(async (
    events: GCalEventInput[]
  ): Promise<CreateEventsResult> => {
    const token = accessTokenRef.current;
    const calId = selectedCalendarIdRef.current;
    if (!token || !calId) {
      return { calendarId: calId, createdKeys: [], failed: 0, error: t("gcal.noCalendar") };
    }

    setCreating(true);
    try {
      const results = await settleWithConcurrency(events, MAX_CONCURRENT_REQUESTS, async (ev) => {
        // Stop sending once another request has seen the token expire
        if (accessTokenRef.current !== token) throw new Error(TOKEN_EXPIRED);
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              summary: ev.summary,
              ...(ev.description ? { description: ev.description } : {}),
              start: { dateTime: ev.start },
              end: { dateTime: ev.end },
            }),
          }
        );
        if (res.status === 401) {
          accessTokenRef.current = null;
          setConnected(false);
          setCalendarList([]);
          throw new Error(TOKEN_EXPIRED);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });

      const createdKeys = events.filter((_, i) => results[i]?.status === "fulfilled").map((ev) => ev.key);
      const failed = events.length - createdKeys.length;
      const tokenExpired = results.some(
        (r) => r.status === "rejected" && (r.reason as Error | undefined)?.message === TOKEN_EXPIRED
      );

      const error = tokenExpired
        ? t("gcal.tokenExpired")
        : failed > 0 ? t("gcal.addFailed", { n: failed }) : null;
      return { calendarId: calId, createdKeys, failed, error };
    } finally {
      setCreating(false);
    }
  }, []);

  const getSelectedCalendarId = useCallback(() => selectedCalendarIdRef.current, []);

  return {
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
  };
}
