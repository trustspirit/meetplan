import { describe, it, expect, vi, beforeEach } from "vitest";

let docs: Record<string, Record<string, unknown> | undefined> = {};
const setMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("../src/lib/admin", () => ({
  getDb: () => ({
    doc: (p: string) => ({
      get: async () => ({ exists: !!docs[p], data: () => docs[p] }),
      delete: () => deleteMock(p),
    }),
    collection: (p: string) => ({
      doc: () => ({ id: "r_new", set: (d: unknown) => setMock(p, d) }),
    }),
  }),
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "__ts__" },
}));

import { hostAddResponseImpl, hostDeleteResponseImpl } from "../src/hostResponses";

const EVENT = { ownerUid: "host", slots: [{ id: "s1" }, { id: "s2" }] };
const addInput = { eventId: "e1", name: "홍길동", selectedSlotIds: ["s1", "s1", "s2"] };

describe("hostAddResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docs = { "events/e1": EVENT };
  });

  it("rejects unauthenticated", async () => {
    await expect(hostAddResponseImpl({ data: addInput, auth: null })).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("rejects non-owner", async () => {
    await expect(
      hostAddResponseImpl({ data: addInput, auth: { uid: "other" } })
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("rejects empty slot selection", async () => {
    await expect(
      hostAddResponseImpl({ data: { ...addInput, selectedSlotIds: [] }, auth: { uid: "host" } })
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects unknown slot", async () => {
    await expect(
      hostAddResponseImpl({ data: { ...addInput, selectedSlotIds: ["nope"] }, auth: { uid: "host" } })
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects ward visit events", async () => {
    docs["events/e1"] = { ...EVENT, eventType: "ward_visit" };
    await expect(
      hostAddResponseImpl({ data: addInput, auth: { uid: "host" } })
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });

  it("creates a host-added response with deduped slots", async () => {
    const out = await hostAddResponseImpl({ data: addInput, auth: { uid: "host" } });
    expect(out).toEqual({ responseId: "r_new" });
    expect(setMock).toHaveBeenCalledWith("events/e1/responses", {
      id: "r_new",
      name: "홍길동",
      selectedSlotIds: ["s1", "s2"],
      ownerUid: null,
      editTokenHash: null,
      addedByHost: true,
      createdAt: "__ts__",
      updatedAt: "__ts__",
    });
  });
});

describe("hostDeleteResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docs = { "events/e1": EVENT };
  });

  const input = { eventId: "e1", responseId: "r1" };

  it("rejects non-owner", async () => {
    docs["events/e1/responses/r1"] = { addedByHost: true };
    await expect(
      hostDeleteResponseImpl({ data: input, auth: { uid: "other" } })
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("refuses to delete a participant's own response", async () => {
    docs["events/e1/responses/r1"] = { ownerUid: null };
    await expect(
      hostDeleteResponseImpl({ data: input, auth: { uid: "host" } })
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes a host-added response", async () => {
    docs["events/e1/responses/r1"] = { addedByHost: true };
    await expect(
      hostDeleteResponseImpl({ data: input, auth: { uid: "host" } })
    ).resolves.toEqual({ deleted: true });
    expect(deleteMock).toHaveBeenCalledWith("events/e1/responses/r1");
  });
});
