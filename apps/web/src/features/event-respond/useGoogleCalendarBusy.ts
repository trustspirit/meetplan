import { useState, useCallback } from "react";
import { connectGoogleCalendar, type CalendarListItem } from "@/lib/googleCalendar";

export type { CalendarListItem };

export interface BusyInterval {
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

export interface GoogleCalendarBusyState {
  // Step 1: auth + fetch calendar list
  calendarList: CalendarListItem[];
  selectedCalendarId: string | null;
  setSelectedCalendarId: (id: string) => void;
  connectCalendar: () => Promise<boolean>;
  // Step 2: fetch busy times for selected calendar
  busyIntervals: BusyInterval[];
  loading: boolean;
  error: string | null;
  synced: boolean;
  syncCalendar: (timeMin: string, timeMax: string) => Promise<boolean>;
}

export function useGoogleCalendarBusy(): GoogleCalendarBusyState {
  const [calendarList, setCalendarList] = useState<CalendarListItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [busyIntervals, setBusyIntervals] = useState<BusyInterval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  // Step 1: OAuth popup → fetch calendar list → user picks a calendar
  const connectCalendar = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const conn = await connectGoogleCalendar(["calendar.readonly"], "reader");
      if (!conn) return false;
      const { token, items } = conn;
      setCalendarList(items);
      setAccessToken(token);
      // Pre-select primary calendar
      const primary = items.find((c) => c.primary);
      setSelectedCalendarId(primary?.id ?? items[0]?.id ?? null);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Step 2: fetch freeBusy for the selected calendar using stored token
  const syncCalendar = useCallback(async (timeMin: string, timeMax: string): Promise<boolean> => {
    if (!accessToken || !selectedCalendarId) {
      setError("캘린더를 먼저 선택하세요");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: selectedCalendarId }],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired — reset so user must reconnect
          setAccessToken(null);
          setCalendarList([]);
          setSynced(false);
          throw new Error("캘린더 인증이 만료되었습니다. 다시 연동해주세요.");
        }
        throw new Error("캘린더 일정을 불러오지 못했습니다");
      }

      const data = await response.json();
      // freeBusy returns busy times keyed by the calendar id
      const busy = data.calendars?.[selectedCalendarId]?.busy ?? [];
      setBusyIntervals(busy);
      setSynced(true);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedCalendarId]);

  return {
    calendarList,
    selectedCalendarId,
    setSelectedCalendarId,
    connectCalendar,
    busyIntervals,
    loading,
    error,
    synced,
    syncCalendar,
  };
}
