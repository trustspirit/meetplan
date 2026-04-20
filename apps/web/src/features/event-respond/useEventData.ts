import { useEffect, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MeetplanEvent } from "@meetplan/shared";

type FsEvent = Omit<MeetplanEvent, "createdAt" | "updatedAt"> & {
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export interface EventDataState {
  loading: boolean;
  event: MeetplanEvent | null;
  error: string | null;
}

export function useEventData(eventId: string | undefined): EventDataState {
  const [state, setState] = useState<EventDataState>({ loading: true, event: null, error: null });

  useEffect(() => {
    if (!eventId) {
      setState({ loading: false, event: null, error: "missing event id" });
      return;
    }
    const unsub = onSnapshot(
      doc(db, "events", eventId),
      (snap) => {
        if (!snap.exists()) {
          setState({ loading: false, event: null, error: "이벤트를 찾을 수 없습니다" });
          return;
        }
        const raw = snap.data() as FsEvent;
        setState({
          loading: false,
          error: null,
          event: {
            ...raw,
            id: snap.id,
            createdAt: raw.createdAt ? raw.createdAt.toDate().toISOString() : "",
            updatedAt: raw.updatedAt ? raw.updatedAt.toDate().toISOString() : "",
          },
        });
      },
      (err) => setState({ loading: false, event: null, error: err.message })
    );
    return unsub;
  }, [eventId]);

  return state;
}
