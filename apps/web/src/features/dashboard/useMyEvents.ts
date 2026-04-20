import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/useAuth";
import type { MeetplanEvent } from "@meetplan/shared";

interface FirestoreEvent extends Omit<MeetplanEvent, "createdAt" | "updatedAt"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function useMyEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<MeetplanEvent[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "events"),
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const out: MeetplanEvent[] = snap.docs.map((d) => {
        const data = d.data() as FirestoreEvent;
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt.toDate().toISOString(),
        };
      });
      setEvents(out);
    });
    return unsub;
  }, [user]);

  return events;
}
