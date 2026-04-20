import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import {
  getResponseInputSchema,
  type GetResponseInput,
  type GetResponseOutput,
} from "@meetplan/shared";
import { getDb } from "./lib/admin";
import { verifyToken } from "./lib/tokens";

export const getResponse = onCall(
  { region: "asia-northeast3", maxInstances: 10 },
  async (req: CallableRequest<unknown>): Promise<GetResponseOutput> => {
    const parsed = getResponseInputSchema.safeParse(req.data);
    if (!parsed.success) {
      throw new HttpsError("invalid-argument", parsed.error.errors[0]?.message ?? "invalid input");
    }
    const input: GetResponseInput = parsed.data;
    const db = getDb();
    const authedUid = req.auth?.uid ?? null;

    // 토큰 기반 조회 (익명)
    if (input.rid && input.token) {
      const docRef = db.doc(`events/${input.eventId}/responses/${input.rid}`);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return { found: false };
      const doc = docSnap.data() as {
        id: string; name: string; phone: string;
        selectedSlotIds: string[];
        editTokenHash: string | null;
        updatedAt: { toDate(): Date } | null;
      };
      if (!doc.editTokenHash || !verifyToken(input.token, doc.editTokenHash)) {
        throw new HttpsError("permission-denied", "invalid token");
      }
      return {
        found: true,
        response: {
          id: doc.id,
          name: doc.name,
          phone: doc.phone,
          selectedSlotIds: doc.selectedSlotIds,
          updatedAt: doc.updatedAt ? doc.updatedAt.toDate().toISOString() : new Date().toISOString(),
        },
      };
    }

    // uid 기반 조회 (로그인)
    if (authedUid) {
      const snap = await db
        .collection(`events/${input.eventId}/responses`)
        .where("ownerUid", "==", authedUid)
        .limit(1)
        .get();
      if (snap.empty) return { found: false };
      const doc = snap.docs[0]!.data() as {
        id: string; name: string; phone: string;
        selectedSlotIds: string[];
        updatedAt: { toDate(): Date } | null;
      };
      return {
        found: true,
        response: {
          id: doc.id,
          name: doc.name,
          phone: doc.phone,
          selectedSlotIds: doc.selectedSlotIds,
          updatedAt: doc.updatedAt ? doc.updatedAt.toDate().toISOString() : new Date().toISOString(),
        },
      };
    }

    throw new HttpsError("invalid-argument", "either (rid + token) or authenticated session required");
  }
);
