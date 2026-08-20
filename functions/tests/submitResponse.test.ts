import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";

interface MockEvent {
  status: string;
  slots: { id: string }[];
  eventType?: string;
  collectPhone?: boolean;
  responseFields?: { id: string; label: string; required: boolean }[];
}

let mockEvent: MockEvent | null = null;
let createdDoc: Record<string, unknown> | null = null;

const setMock = vi.fn(async (data: Record<string, unknown>) => { createdDoc = data; });

vi.mock("../src/lib/admin", () => ({
  getDb: () => ({
    doc: (_p: string) => ({
      get: async () => ({ exists: !!mockEvent, data: () => mockEvent! }),
    }),
    collection: (_p: string) => ({
      doc: (_id?: string) => ({ id: "resp1", get: async () => ({ exists: false }), set: setMock }),
    }),
  }),
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: () => "TS",
    delete: () => "DELETE",
  },
}));

import { submitResponseImpl } from "../src/submitResponse";

const BASE_INPUT = {
  eventId: "e1",
  name: "김민수",
  phone: "010-1234-5678",
  selectedSlotIds: ["s1"],
};

describe("submitResponse — 수집 항목 검증", () => {
  beforeEach(() => {
    createdDoc = null;
    setMock.mockClear();
    mockEvent = { status: "open", slots: [{ id: "s1" }] };
  });

  it("레거시 이벤트(설정 없음)는 전화번호를 계속 요구한다", async () => {
    await expect(
      submitResponseImpl({ data: { ...BASE_INPUT, phone: undefined }, auth: null })
    ).rejects.toThrow(HttpsError);
  });

  it("collectPhone=false면 전화번호 없이 제출된다", async () => {
    mockEvent = { status: "open", slots: [{ id: "s1" }], collectPhone: false };
    await submitResponseImpl({ data: { ...BASE_INPUT, phone: undefined }, auth: null });
    expect(createdDoc).not.toBeNull();
    expect(createdDoc).not.toHaveProperty("phone");
  });

  it("collectPhone=false면 전화번호를 보내도 저장하지 않는다", async () => {
    mockEvent = { status: "open", slots: [{ id: "s1" }], collectPhone: false };
    await submitResponseImpl({ data: BASE_INPUT, auth: null });
    expect(createdDoc).not.toHaveProperty("phone");
  });

  it("필수 항목이 비면 거부한다", async () => {
    mockEvent = {
      status: "open", slots: [{ id: "s1" }],
      responseFields: [{ id: "team", label: "소속", required: true }],
    };
    await expect(
      submitResponseImpl({ data: BASE_INPUT, auth: null })
    ).rejects.toThrow(HttpsError);
  });

  it("정의되지 않은 항목 키를 거부한다", async () => {
    mockEvent = {
      status: "open", slots: [{ id: "s1" }],
      responseFields: [{ id: "team", label: "소속", required: false }],
    };
    await expect(
      submitResponseImpl({ data: { ...BASE_INPUT, answers: { ghost: "x" } }, auth: null })
    ).rejects.toThrow(HttpsError);
  });

  it("정상 답변을 저장한다", async () => {
    mockEvent = {
      status: "open", slots: [{ id: "s1" }],
      responseFields: [{ id: "team", label: "소속", required: true }],
    };
    await submitResponseImpl({ data: { ...BASE_INPUT, answers: { team: "  1팀  " } }, auth: null });
    expect(createdDoc).toMatchObject({ answers: { team: "1팀" } });
  });

  it("답변이 없으면 answers 필드를 만들지 않는다", async () => {
    await submitResponseImpl({ data: BASE_INPUT, auth: null });
    expect(createdDoc).not.toHaveProperty("answers");
  });

  // 회귀: ward_visit은 슬롯 대신 와드 배정을 쓴다. requireSlots를 빠뜨리면 전부 막힌다.
  it("ward_visit 응답은 슬롯이 없어도 통과한다", async () => {
    mockEvent = { status: "open", slots: [], eventType: "ward_visit" };
    await submitResponseImpl({
      data: {
        ...BASE_INPUT,
        selectedSlotIds: [],
        wardAssignments: [{ wardId: "w1", wardName: "1와드", date: "2026-06-07" }],
      },
      auth: null,
    });
    expect(createdDoc).not.toBeNull();
  });
});
