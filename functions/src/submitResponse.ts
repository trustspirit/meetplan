import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import {
  submitResponseInputSchema,
  type SubmitResponseInput,
  type SubmitResponseOutput,
  normalizePhone,
} from "@meetplan/shared";
import { getDb } from "./lib/admin";
import { generateToken, hashToken, verifyToken } from "./lib/tokens";

export const submitResponse = onCall(
  { region: "asia-northeast3", maxInstances: 10, invoker: "public" },
  async (req: CallableRequest<unknown>): Promise<SubmitResponseOutput> => {
    const parsed = submitResponseInputSchema.safeParse(req.data);
    if (!parsed.success) {
      throw new HttpsError("invalid-argument", parsed.error.errors[0]?.message ?? "invalid input");
    }
    const input: SubmitResponseInput = parsed.data;

    const db = getDb();
    const eventRef = db.doc(`events/${input.eventId}`);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) throw new HttpsError("not-found", "event not found");
    const event = eventSnap.data() as { status: string; slots: { id: string }[]; eventType?: string };
    if (event.status !== "open") throw new HttpsError("failed-precondition", "event is closed");

    const isWardVisit = event.eventType === "ward_visit";
    if (!isWardVisit) {
      const validSlotIds = new Set(event.slots.map((s) => s.id));
      for (const id of input.selectedSlotIds) {
        if (!validSlotIds.has(id)) {
          throw new HttpsError("invalid-argument", `slot ${id} does not exist on event`);
        }
      }
    }

    const normalizedPhone = normalizePhone(input.phone);
    const responsesCol = db.collection(`events/${input.eventId}/responses`);
    const now = FieldValue.serverTimestamp();
    const authedUid = req.auth?.uid ?? null;

    // 편집 경로
    if (input.rid) {
      const docRef = responsesCol.doc(input.rid);
      const docSnap = await docRef.get();
      if (!docSnap.exists) throw new HttpsError("not-found", "response not found");
      const doc = docSnap.data() as {
        ownerUid: string | null;
        editTokenHash: string | null;
      };

      if (doc.ownerUid) {
        if (doc.ownerUid !== authedUid) {
          throw new HttpsError("permission-denied", "not your response");
        }
      } else {
        if (!input.token || !doc.editTokenHash || !verifyToken(input.token, doc.editTokenHash)) {
          throw new HttpsError("permission-denied", "invalid token");
        }
      }

      const updateData: Record<string, unknown> = {
        name: input.name,
        phone: normalizedPhone,
        selectedSlotIds: input.selectedSlotIds,
        updatedAt: now,
      };
      if (input.wardAssignments) updateData.wardAssignments = input.wardAssignments;
      await docRef.update(updateData);
      return { responseId: input.rid };
    }

    const baseFields: Record<string, unknown> = {
      name: input.name,
      phone: normalizedPhone,
      selectedSlotIds: input.selectedSlotIds,
      createdAt: now,
      updatedAt: now,
    };
    if (input.wardAssignments) baseFields.wardAssignments = input.wardAssignments;

    // 신규 생성 경로
    // For authenticated users: use uid as deterministic doc ID to prevent duplicates on retry/double-submit
    if (authedUid) {
      const docRef = responsesCol.doc(authedUid);
      const base = { id: docRef.id, ...baseFields };
      await docRef.set({ ...base, ownerUid: authedUid, editTokenHash: null }, { merge: false });
      return { responseId: docRef.id };
    }

    const docRef = responsesCol.doc();
    const base = { id: docRef.id, ...baseFields };
    const rawToken = generateToken();
    const editTokenHash = hashToken(rawToken);
    await docRef.set({ ...base, ownerUid: null, editTokenHash });
    return { responseId: docRef.id, rawToken };
  }
);
