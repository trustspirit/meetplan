import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import {
  updateEventSlotsInputSchema,
  type UpdateEventSlotsInput,
  type UpdateEventSlotsOutput,
} from "@meetplan/shared";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./lib/admin";

export async function updateEventSlotsImpl(req: {
  data: unknown;
  auth: { uid: string } | null;
}): Promise<UpdateEventSlotsOutput> {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "login required");
  }
  const parsed = updateEventSlotsInputSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.errors[0]?.message ?? "invalid input");
  }
  const input: UpdateEventSlotsInput = parsed.data;

  const db = getDb();
  const eventRef = db.doc(`events/${input.eventId}`);
  const responsesCol = db.collection(`events/${input.eventId}/responses`);
  const newValidIds = new Set(input.slots.map((s) => s.id));

  let affected = 0;

  await db.runTransaction(async (tx) => {
    // Retry-safe: count fresh inside callback, assign to outer only at end.
    let localAffected = 0;

    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "event not found");
    }
    const ownerUid = (eventSnap.data() as { ownerUid: string }).ownerUid;
    if (ownerUid !== req.auth!.uid) {
      throw new HttpsError("permission-denied", "not your event");
    }

    const responsesSnap = await tx.get(responsesCol);
    for (const d of responsesSnap.docs) {
      const data = d.data() as { selectedSlotIds: string[] };
      const keep = data.selectedSlotIds.filter((id) => newValidIds.has(id));
      if (keep.length !== data.selectedSlotIds.length) {
        localAffected++;
        tx.update(d.ref, { selectedSlotIds: keep });
      }
    }

    tx.update(eventRef, {
      slots: input.slots,
      updatedAt: FieldValue.serverTimestamp(),
    });

    affected = localAffected;
  });

  return { affectedResponses: affected };
}

export const updateEventSlots = onCall(
  { region: "asia-northeast3", maxInstances: 10, invoker: "public" },
  async (req: CallableRequest<unknown>): Promise<UpdateEventSlotsOutput> =>
    updateEventSlotsImpl({ data: req.data, auth: req.auth ? { uid: req.auth.uid } : null })
);
