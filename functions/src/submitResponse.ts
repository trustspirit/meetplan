import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import {
  submitResponseInputSchema,
  type SubmitResponseInput,
  type SubmitResponseOutput,
  type ResponseField,
  normalizePhone,
  eventCollectsPhone,
  eventResponseFields,
  validateResponseInput,
  sanitizeAnswers,
} from "@meetplan/shared";
import { getDb } from "./lib/admin";
import { generateToken, hashToken, verifyToken } from "./lib/tokens";

export async function submitResponseImpl(req: {
  data: unknown;
  auth: { uid: string } | null;
}): Promise<SubmitResponseOutput> {
  const parsed = submitResponseInputSchema.safeParse(req.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.errors[0]?.message ?? "invalid input");
  }
  const input: SubmitResponseInput = parsed.data;

  const db = getDb();
  const eventRef = db.doc(`events/${input.eventId}`);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) throw new HttpsError("not-found", "event not found");
  const event = eventSnap.data() as {
    status: string;
    slots: { id: string }[];
    eventType?: string;
    collectPhone?: boolean;
    responseFields?: ResponseField[];
  };
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

  // 이벤트 설정과의 교차 검증. 스키마는 입력만 보므로 여기서만 잡을 수 있다.
  const fields = eventResponseFields(event);
  const collectPhone = eventCollectsPhone(event);
  const violation = validateResponseInput(
    { collectPhone, fields, requireSlots: !isWardVisit },
    {
      name: input.name,
      phone: input.phone,
      answers: input.answers,
      selectedSlotCount: input.selectedSlotIds.length,
    }
  );
  if (violation) {
    // 클라이언트가 먼저 막으므로 사용자가 볼 일은 없다. 도달하면 버그이거나 변조다.
    const detail = "fieldId" in violation ? `${violation.code}:${violation.fieldId}` : violation.code;
    throw new HttpsError("invalid-argument", detail);
  }

  // 안 물어본 정보는 남기지 않는다.
  const phoneToStore = collectPhone && input.phone ? normalizePhone(input.phone) : null;
  const answers = sanitizeAnswers(fields, input.answers);
  const hasAnswers = Object.keys(answers).length > 0;

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
      phone: phoneToStore ?? FieldValue.delete(),
      note: input.note ?? FieldValue.delete(),
      answers: hasAnswers ? answers : FieldValue.delete(),
      selectedSlotIds: input.selectedSlotIds,
      updatedAt: now,
    };
    if (input.wardAssignments) updateData.wardAssignments = input.wardAssignments;
    await docRef.update(updateData);
    return { responseId: input.rid };
  }

  const baseFields: Record<string, unknown> = {
    name: input.name,
    selectedSlotIds: input.selectedSlotIds,
    createdAt: now,
    updatedAt: now,
    ...(phoneToStore ? { phone: phoneToStore } : {}),
    ...(hasAnswers ? { answers } : {}),
    ...(input.note ? { note: input.note } : {}),
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

export const submitResponse = onCall(
  { region: "asia-northeast3", maxInstances: 10, invoker: "public" },
  (req: CallableRequest<unknown>): Promise<SubmitResponseOutput> =>
    submitResponseImpl({ data: req.data, auth: req.auth ? { uid: req.auth.uid } : null })
);
