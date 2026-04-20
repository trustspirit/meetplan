import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";

// Firestore mock state
let mockEvent: { exists: boolean; data: () => { ownerUid: string } } | null = null;
let mockResponseDocs: Array<{ ref: { delete: ReturnType<typeof vi.fn> } }> = [];
const batchCommit = vi.fn();
const batchDelete = vi.fn();
const eventDelete = vi.fn();

vi.mock("../src/lib/admin", () => ({
  getDb: () => ({
    doc: (_p: string) => ({
      get: async () => mockEvent ?? { exists: false },
      delete: eventDelete,
    }),
    collection: (_p: string) => ({
      get: async () => ({ docs: mockResponseDocs, size: mockResponseDocs.length }),
    }),
    batch: () => ({
      delete: batchDelete,
      commit: batchCommit,
    }),
  }),
}));

import { deleteEventImpl } from "../src/deleteEvent";

describe("deleteEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = null;
    mockResponseDocs = [];
  });

  it("rejects unauthenticated caller", async () => {
    await expect(deleteEventImpl({ data: { eventId: "e1" }, auth: null })).rejects.toBeInstanceOf(HttpsError);
  });

  it("rejects bad input (missing eventId)", async () => {
    await expect(
      deleteEventImpl({ data: {}, auth: { uid: "u1" } })
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("rejects when event not found", async () => {
    mockEvent = null;
    await expect(
      deleteEventImpl({ data: { eventId: "e1" }, auth: { uid: "u1" } })
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("rejects when caller is not the owner", async () => {
    mockEvent = { exists: true, data: () => ({ ownerUid: "someone-else" }) };
    await expect(
      deleteEventImpl({ data: { eventId: "e1" }, auth: { uid: "u1" } })
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  it("deletes event and all responses in a batch", async () => {
    mockEvent = { exists: true, data: () => ({ ownerUid: "u1" }) };
    mockResponseDocs = [
      { ref: { delete: vi.fn() } },
      { ref: { delete: vi.fn() } },
      { ref: { delete: vi.fn() } },
    ];

    const result = await deleteEventImpl({ data: { eventId: "e1" }, auth: { uid: "u1" } });

    expect(batchDelete).toHaveBeenCalledTimes(4); // 3 responses + 1 event
    expect(batchCommit).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ deletedResponses: 3 });
  });

  it("returns 0 when event has no responses", async () => {
    mockEvent = { exists: true, data: () => ({ ownerUid: "u1" }) };
    mockResponseDocs = [];

    const result = await deleteEventImpl({ data: { eventId: "e1" }, auth: { uid: "u1" } });

    expect(result).toEqual({ deletedResponses: 0 });
    expect(batchDelete).toHaveBeenCalledTimes(1); // event only
    expect(batchCommit).toHaveBeenCalledTimes(1);
  });
});
