import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import {
  hostAddResponseInputSchema,
  hostDeleteResponseInputSchema,
  type HostAddResponseOutput,
  type HostDeleteResponseOutput,
} from "@meetplan/shared";
import { getDb } from "./lib/admin";

type Req = { data: unknown; auth: { uid: string } | null };

interface EventDoc {
  ownerUid: string;
  slots: { id: string }[];
  eventType?: string;
}

async function loadOwnedEvent(eventId: string, uid: string): Promise<EventDoc> {
  const snap = await getDb().doc(`events/${eventId}`).get();
  if (!snap.exists) throw new HttpsError("not-found", "event not found");
  const event = snap.data() as EventDoc;
  if (event.ownerUid !== uid) throw new HttpsError("permission-denied", "not your event");
  return event;
}

/**
 * 호스트가 이름과 가능한 슬롯을 직접 넣는다. 마감된 이벤트에도 허용한다 —
 * 호스트 본인의 결과 화면이므로 참가자 응답 마감과는 별개다.
 * 전화번호·추가 항목은 받지 않는다(호스트가 대신 알 수 없는 정보).
 */
export async function hostAddResponseImpl(req: Req): Promise<HostAddResponseOutput> {
  if (!req.auth) throw new HttpsError("unauthenticated", "login required");
  const parsed = hostAddResponseInputSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.errors[0]?.message ?? "invalid input");
  }
  const input = parsed.data;

  const event = await loadOwnedEvent(input.eventId, req.auth.uid);
  if (event.eventType === "ward_visit") {
    throw new HttpsError("failed-precondition", "not supported for ward visit events");
  }
  const validSlotIds = new Set(event.slots.map((s) => s.id));
  for (const id of input.selectedSlotIds) {
    if (!validSlotIds.has(id)) {
      throw new HttpsError("invalid-argument", `slot ${id} does not exist on event`);
    }
  }

  const docRef = getDb().collection(`events/${input.eventId}/responses`).doc();
  const now = FieldValue.serverTimestamp();
  await docRef.set({
    id: docRef.id,
    name: input.name,
    selectedSlotIds: [...new Set(input.selectedSlotIds)],
    ownerUid: null,
    editTokenHash: null,
    addedByHost: true,
    createdAt: now,
    updatedAt: now,
  });
  return { responseId: docRef.id };
}

export async function hostDeleteResponseImpl(req: Req): Promise<HostDeleteResponseOutput> {
  if (!req.auth) throw new HttpsError("unauthenticated", "login required");
  const parsed = hostDeleteResponseInputSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.errors[0]?.message ?? "invalid input");
  }
  const input = parsed.data;

  await loadOwnedEvent(input.eventId, req.auth.uid);
  const docRef = getDb().doc(`events/${input.eventId}/responses/${input.responseId}`);
  const snap = await docRef.get();
  if (!snap.exists) throw new HttpsError("not-found", "response not found");
  if ((snap.data() as { addedByHost?: boolean }).addedByHost !== true) {
    throw new HttpsError("permission-denied", "only host-added responses can be deleted");
  }
  await docRef.delete();
  return { deleted: true };
}

export const hostAddResponse = onCall(
  { region: "asia-northeast3", maxInstances: 10, invoker: "public" },
  (req: CallableRequest<unknown>): Promise<HostAddResponseOutput> =>
    hostAddResponseImpl({ data: req.data, auth: req.auth ? { uid: req.auth.uid } : null })
);

export const hostDeleteResponse = onCall(
  { region: "asia-northeast3", maxInstances: 10, invoker: "public" },
  (req: CallableRequest<unknown>): Promise<HostDeleteResponseOutput> =>
    hostDeleteResponseImpl({ data: req.data, auth: req.auth ? { uid: req.auth.uid } : null })
);
