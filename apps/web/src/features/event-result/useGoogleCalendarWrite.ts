import { useState, useCallback, useRef } from "react";
import { reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface CalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface GCalEventInput {
  summary: string;
  description?: string;
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

const STORAGE_KEY = "meetplan-gcal-write-id";

function readStoredCalendarId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export function useGoogleCalendarWrite() {
  const accessTokenRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [calendarList, setCalendarList] = useState<CalendarListItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarIdState] = useState<string | null>(readStoredCalendarId);
  const [creating, setCreating] = useState(false);

  const setSelectedCalendarId = useCallback((id: string) => {
    setSelectedCalendarIdState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) { setConnectError("로그인이 필요합니다"); return false; }

    setConnecting(true);
    setConnectError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar.events");
      const result = await reauthenticateWithPopup(currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) throw new Error("캘린더 접근 권한을 가져오지 못했습니다");

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("캘린더 목록을 불러오지 못했습니다");

      const data = await res.json();
      const items: CalendarListItem[] = (data.items ?? []).map(
        (c: { id: string; summary: string; primary?: boolean }) => ({
          id: c.id, summary: c.summary, primary: c.primary,
        })
      );
      setCalendarList(items);
      accessTokenRef.current = token;
      setConnected(true);

      // Select stored calendar if still valid, otherwise fall back to primary
      const storedId = readStoredCalendarId();
      if (!storedId || !items.some((c) => c.id === storedId)) {
        const fallback = items.find((c) => c.primary)?.id ?? items[0]?.id ?? null;
        if (fallback) setSelectedCalendarId(fallback);
      }
      return true;
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return false;
      }
      setConnectError(e instanceof Error ? e.message : "오류가 발생했습니다");
      return false;
    } finally {
      setConnecting(false);
    }
  }, [setSelectedCalendarId]);

  const createEvents = useCallback(async (
    events: GCalEventInput[]
  ): Promise<{ created: number; error: string | null }> => {
    const token = accessTokenRef.current;
    const calId = selectedCalendarId ?? readStoredCalendarId();
    if (!token || !calId) return { created: 0, error: "캘린더를 먼저 연결해주세요" };

    setCreating(true);
    try {
      const results = await Promise.allSettled(
        events.map((ev) =>
          fetch(
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
          ).then(async (res) => {
            if (res.status === 401) {
              accessTokenRef.current = null;
              setConnected(false);
              setCalendarList([]);
              throw new Error("TOKEN_EXPIRED");
            }
            if (!res.ok) throw new Error("이벤트 생성 실패");
          })
        )
      );

      const created = results.filter((r) => r.status === "fulfilled").length;
      const tokenExpired = results.some(
        (r) =>
          r.status === "rejected" &&
          (r as PromiseRejectedResult).reason?.message === "TOKEN_EXPIRED"
      );

      if (tokenExpired) {
        return { created, error: "인증이 만료되었습니다. 다시 연결해주세요." };
      }
      const failed = results.filter((r) => r.status === "rejected").length;
      return { created, error: failed > 0 ? `${failed}개 이벤트 추가 실패` : null };
    } finally {
      setCreating(false);
    }
  }, [selectedCalendarId]);

  return {
    connected,
    connecting,
    connectError,
    calendarList,
    selectedCalendarId,
    setSelectedCalendarId,
    connect,
    createEvents,
    creating,
  };
}
