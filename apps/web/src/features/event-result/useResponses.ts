import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ParticipantResponse } from "@meetplan/shared";

type FsResponse = Omit<ParticipantResponse, "createdAt" | "updatedAt"> & {
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export interface ResponsesState {
  loading: boolean;
  responses: ParticipantResponse[];
  error: string | null;
}

export function useResponses(eventId: string | undefined): ResponsesState {
  const [state, setState] = useState<ResponsesState>({
    loading: true, responses: [], error: null,
  });

  useEffect(() => {
    if (!eventId) {
      setState({ loading: false, responses: [], error: null });
      return;
    }
    const q = query(
      collection(db, "events", eventId, "responses"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const out: ParticipantResponse[] = snap.docs.map((d) => {
          const raw = d.data() as FsResponse;
          return {
            ...raw,
            id: d.id,
            createdAt: raw.createdAt ? raw.createdAt.toDate().toISOString() : "",
            updatedAt: raw.updatedAt ? raw.updatedAt.toDate().toISOString() : "",
          };
        });
        setState({ loading: false, responses: out, error: null });
      },
      (err) => setState({ loading: false, responses: [], error: err.message })
    );
    return unsub;
  }, [eventId]);

  return state;
}
