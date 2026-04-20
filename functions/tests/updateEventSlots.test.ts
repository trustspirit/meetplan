import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";

let mockEventData: { ownerUid: string; slots: { id: string }[] } | null = null;
let mockResponseDocs: Array<{
  id: string;
  ref: { id: string };
  data: () => { selectedSlotIds: string[] };
}> = [];
let txUpdates: Array<{ target: any; patch: any }> = [];

const runTransactionMock = vi.fn(async (fn: (tx: any) => Promise<void>) => {
  const tx = {
    get: vi.fn(async (refOrQuery: any) => {
      if (refOrQuery.__kind === "eventRef") {
        return { exists: !!mockEventData, data: () => mockEventData! };
      }
      return { docs: mockResponseDocs, size: mockResponseDocs.length };
    }),
    update: vi.fn((ref: any, patch: any) => { txUpdates.push({ target: ref, patch }); }),
  };
  await fn(tx);
});

vi.mock("../src/lib/admin", () => ({
  getDb: () => ({
    doc: (_p: string) => ({ __kind: "eventRef" }),
    collection: (_p: string) => ({ __kind: "responsesCol" }),
    runTransaction: runTransactionMock,
  }),
}));

import { updateEventSlotsImpl } from "../src/updateEventSlots";

const NEW_SLOTS = [
  { id: "s_new1", start: "2026-04-22T05:00:00.000Z", end: "2026-04-22T05:30:00.000Z" },
];

describe("updateEventSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventData = null;
    mockResponseDocs = [];
    txUpdates = [];
  });

  it("rejects unauthenticated", async () => {
    await expect(
      updateEventSlotsImpl({ data: { eventId: "e1", slots: NEW_SLOTS }, auth: null })
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("rejects bad input (zero slots)", async () => {
    await expect(
      updateEventSlotsImpl({ data: { eventId: "e1", slots: [] }, auth: { uid: "u1" } })
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects when event not found", async () => {
    mockEventData = null;
    await expect(
      updateEventSlotsImpl({ data: { eventId: "e1", slots: NEW_SLOTS }, auth: { uid: "u1" } })
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("rejects when caller is not owner", async () => {
    mockEventData = { ownerUid: "someone-else", slots: [] };
    await expect(
      updateEventSlotsImpl({ data: { eventId: "e1", slots: NEW_SLOTS }, auth: { uid: "u1" } })
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("updates event slots and cleans response selectedSlotIds", async () => {
    mockEventData = {
      ownerUid: "u1",
      slots: [{ id: "s_old1" }, { id: "s_old2" }],
    };
    mockResponseDocs = [
      { id: "r1", ref: { id: "r1" }, data: () => ({ selectedSlotIds: ["s_old1", "s_old2"] }) },
      { id: "r2", ref: { id: "r2" }, data: () => ({ selectedSlotIds: ["s_new1", "s_old1"] }) },
    ];

    const result = await updateEventSlotsImpl({
      data: { eventId: "e1", slots: NEW_SLOTS },
      auth: { uid: "u1" },
    });

    const eventUpdate = txUpdates.find((u) => u.target.__kind === "eventRef");
    expect(eventUpdate?.patch).toMatchObject({ slots: NEW_SLOTS });

    const r1Update = txUpdates.find((u) => u.target.id === "r1");
    expect(r1Update?.patch).toEqual({ selectedSlotIds: [] });

    const r2Update = txUpdates.find((u) => u.target.id === "r2");
    expect(r2Update?.patch).toEqual({ selectedSlotIds: ["s_new1"] });

    expect(result).toEqual({ affectedResponses: 2 });
  });

  it("does not touch responses whose slots are all still valid", async () => {
    mockEventData = { ownerUid: "u1", slots: [{ id: "s_new1" }] };
    mockResponseDocs = [
      { id: "r1", ref: { id: "r1" }, data: () => ({ selectedSlotIds: ["s_new1"] }) },
    ];

    const result = await updateEventSlotsImpl({
      data: { eventId: "e1", slots: NEW_SLOTS },
      auth: { uid: "u1" },
    });

    expect(txUpdates.find((u) => u.target.id === "r1")).toBeUndefined();
    expect(result).toEqual({ affectedResponses: 0 });
  });
});
