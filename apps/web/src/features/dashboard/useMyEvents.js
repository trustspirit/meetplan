import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/useAuth";
export function useMyEvents() {
    const { user } = useAuth();
    const [events, setEvents] = useState(null);
    useEffect(() => {
        if (!user)
            return;
        const q = query(collection(db, "events"), where("ownerUid", "==", user.uid), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const out = snap.docs.map((d) => {
                const data = d.data();
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
