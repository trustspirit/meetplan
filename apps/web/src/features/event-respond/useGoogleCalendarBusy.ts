import { useState, useCallback } from "react";
import { reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface BusyInterval {
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

export interface GoogleCalendarBusyState {
  busyIntervals: BusyInterval[];
  loading: boolean;
  error: string | null;
  synced: boolean;
  syncCalendar: (timeMin: string, timeMax: string) => Promise<boolean>;
}

export function useGoogleCalendarBusy(): GoogleCalendarBusyState {
  const [busyIntervals, setBusyIntervals] = useState<BusyInterval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  const syncCalendar = useCallback(async (timeMin: string, timeMax: string): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("로그인이 필요합니다");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar.freebusy");
      // reauthenticateWithPopup ensures the same Google account — prevents accidental account switching
      const result = await reauthenticateWithPopup(currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (!accessToken) throw new Error("캘린더 접근 권한을 가져오지 못했습니다");

      const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        }),
      });

      if (!response.ok) throw new Error("캘린더 일정을 불러오지 못했습니다");

      const data = await response.json();
      setBusyIntervals(data.calendars?.primary?.busy ?? []);
      setSynced(true);
      return true;
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      // User closed the popup — not an error
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return false;
      }
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { busyIntervals, loading, error, synced, syncCalendar };
}
