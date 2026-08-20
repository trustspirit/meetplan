import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashToken } from "../src/lib/tokens";

interface MockEvent {
  status: string;
  slots: { id: string }[];
  eventType?: string;
  collectPhone?: boolean;
  responseFields?: { id: string; label: string; required: boolean }[];
}

let mockEvent: MockEvent | null = null;
let createdDoc: Record<string, unknown> | null = null;
let mockResponseDoc: Record<string, unknown> | null = null;
let updatedDoc: Record<string, unknown> | null = null;

const setMock = vi.fn(async (data: Record<string, unknown>) => { createdDoc = data; });
const updateMock = vi.fn(async (data: Record<string, unknown>) => { updatedDoc = data; });

vi.mock("../src/lib/admin", () => ({
  getDb: () => ({
    doc: (_p: string) => ({
      get: async () => ({ exists: !!mockEvent, data: () => mockEvent! }),
    }),
    collection: (_p: string) => ({
      doc: (_id?: string) => ({
        id: "resp1",
        get: async () => ({ exists: !!mockResponseDoc, data: () => mockResponseDoc }),
        set: setMock,
        update: updateMock,
      }),
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
    updatedDoc = null;
    mockResponseDoc = null;
    setMock.mockClear();
    updateMock.mockClear();
    mockEvent = { status: "open", slots: [{ id: "s1" }] };
  });

  it("레거시 이벤트(설정 없음)는 전화번호를 계속 요구한다", async () => {
    await expect(
      submitResponseImpl({ data: { ...BASE_INPUT, phone: undefined }, auth: null })
    ).rejects.toThrow(/phone_missing/);
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

  it("collectPhone이 true(기본)이면 전화번호를 정규화해 저장한다", async () => {
    await submitResponseImpl({ data: BASE_INPUT, auth: null });
    expect(createdDoc).toMatchObject({ phone: "01012345678" });
  });

  it("필수 항목이 비면 거부한다", async () => {
    mockEvent = {
      status: "open", slots: [{ id: "s1" }],
      responseFields: [{ id: "team", label: "소속", required: true }],
    };
    await expect(
      submitResponseImpl({ data: BASE_INPUT, auth: null })
    ).rejects.toThrow(/field_required:team/);
  });

  it("정의되지 않은 항목 키를 거부한다", async () => {
    mockEvent = {
      status: "open", slots: [{ id: "s1" }],
      responseFields: [{ id: "team", label: "소속", required: false }],
    };
    await expect(
      submitResponseImpl({ data: { ...BASE_INPUT, answers: { ghost: "x" } }, auth: null })
    ).rejects.toThrow(/unknown_field:ghost/);
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

  it("인증된 사용자는 uid를 문서 ID로 사용하며 merge:false로 생성한다", async () => {
    await submitResponseImpl({ data: BASE_INPUT, auth: { uid: "u1" } });
    expect(createdDoc).toMatchObject({ ownerUid: "u1", editTokenHash: null });
    expect(setMock).toHaveBeenCalledWith(expect.anything(), { merge: false });
  });

  describe("편집 경로", () => {
    it("collectPhone=false로 바뀌면 기존 전화번호를 삭제한다", async () => {
      mockEvent = { status: "open", slots: [{ id: "s1" }], collectPhone: false };
      const rawToken = "raw-token-1";
      mockResponseDoc = {
        ownerUid: null,
        editTokenHash: hashToken(rawToken),
        phone: "01099998888",
      };
      await submitResponseImpl({
        data: { ...BASE_INPUT, phone: undefined, rid: "resp1", token: rawToken },
        auth: null,
      });
      expect(updatedDoc).not.toBeNull();
      expect(updatedDoc?.phone).toBe("DELETE");
    });

    it("답변이 비면 저장된 answers를 삭제한다", async () => {
      mockEvent = {
        status: "open", slots: [{ id: "s1" }],
        responseFields: [{ id: "team", label: "소속", required: false }],
      };
      const rawToken = "raw-token-2";
      mockResponseDoc = {
        ownerUid: null,
        editTokenHash: hashToken(rawToken),
        answers: { team: "1팀" },
      };
      await submitResponseImpl({
        data: { ...BASE_INPUT, rid: "resp1", token: rawToken, answers: {} },
        auth: null,
      });
      expect(updatedDoc).not.toBeNull();
      expect(updatedDoc?.answers).toBe("DELETE");
    });

    it("토큰이 틀리면 거부한다", async () => {
      mockResponseDoc = { ownerUid: null, editTokenHash: hashToken("correct-token") };
      await expect(
        submitResponseImpl({
          data: { ...BASE_INPUT, rid: "resp1", token: "wrong-token" },
          auth: null,
        })
      ).rejects.toThrow(/invalid token/);
    });

    it("응답 소유자가 아니면 거부한다", async () => {
      mockResponseDoc = { ownerUid: "u1", editTokenHash: null };
      await expect(
        submitResponseImpl({
          data: { ...BASE_INPUT, rid: "resp1" },
          auth: { uid: "u2" },
        })
      ).rejects.toThrow(/not your response/);
    });
  });
});
