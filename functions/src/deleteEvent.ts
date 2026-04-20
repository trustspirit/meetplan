import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import {
  deleteEventInputSchema,
  type DeleteEventInput,
  type DeleteEventOutput,
} from "@meetplan/shared";
import { getDb } from "./lib/admin";

/**
 * Pure logic — auth/data passed in for test injection.
 */
export async function deleteEventImpl(req: {
  data: unknown;
  auth: { uid: string } | null;
}): Promise<DeleteEventOutput> {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "login required");
  }
  const parsed = deleteEventInputSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.errors[0]?.message ?? "invalid input");
  }
  const input: DeleteEventInput = parsed.data;

  const db = getDb();
  const eventRef = db.doc(`events/${input.eventId}`);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new HttpsError("not-found", "event not found");
  }
  const ownerUid = (eventSnap.data() as { ownerUid: string }).ownerUid;
  if (ownerUid !== req.auth.uid) {
    throw new HttpsError("permission-denied", "not your event");
  }

  // Batch: responses + event. ~30 response assumption per spec, well under 500 limit.
  const responsesSnap = await db.collection(`events/${input.eventId}/responses`).get();
  const batch = db.batch();
  for (const d of responsesSnap.docs) {
    batch.delete(d.ref);
  }
  batch.delete(eventRef);
  await batch.commit();

  return { deletedResponses: responsesSnap.size };
}

export const deleteEvent = onCall(
  { region: "asia-northeast3", maxInstances: 10 },
  async (req: CallableRequest<unknown>): Promise<DeleteEventOutput> =>
    deleteEventImpl({ data: req.data, auth: req.auth ? { uid: req.auth.uid } : null })
);
