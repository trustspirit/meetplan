import { useState, useCallback } from "react";
import { reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface BusyInterval {
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

export interface CalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
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
    const currentUser = auth.currentUser;
    if (!currentUser) { setError("로그인이 필요합니다"); return false; }

    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
      // reauthenticateWithPopup ensures the same Google account — prevents accidental account switching
      const result = await reauthenticateWithPopup(currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) throw new Error("캘린더 접근 권한을 가져오지 못했습니다");

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("캘린더 목록을 불러오지 못했습니다");

      const data = await res.json();
      const items: CalendarListItem[] = (data.items ?? []).map(
        (c: { id: string; summary: string; primary?: boolean }) => ({
          id: c.id,
          summary: c.summary,
          primary: c.primary,
        })
      );
      setCalendarList(items);
      setAccessToken(token);
      // Pre-select primary calendar
      const primary = items.find((c) => c.primary);
      setSelectedCalendarId(primary?.id ?? items[0]?.id ?? null);
      return true;
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return false;
      }
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

      if (!response.ok) throw new Error("캘린더 일정을 불러오지 못했습니다");

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
