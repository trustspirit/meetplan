import { describe, it, expect } from "vitest";
import type { MeetplanEvent, ParticipantResponse } from "@meetplan/shared";
import { buildMatrixModel } from "./matrixModel";

const event: MeetplanEvent = {
  id: "e1",
  ownerUid: "host1",
  title: "T",
  periodMinutes: 30,
  timezone: "Asia/Seoul",
  slots: [
    { id: "s1", start: "2026-04-22T05:00:00.000Z", end: "2026-04-22T05:30:00.000Z" },
    { id: "s2", start: "2026-04-22T05:30:00.000Z", end: "2026-04-22T06:00:00.000Z" },
    { id: "s3", start: "2026-04-22T06:00:00.000Z", end: "2026-04-22T06:30:00.000Z" },
  ],
  status: "open",
  createdAt: "",
  updatedAt: "",
};

const responses: ParticipantResponse[] = [
  { id: "r1", name: "A", phone: "01011112222", selectedSlotIds: ["s1", "s2"], ownerUid: null, editTokenHash: "x", createdAt: "", updatedAt: "" },
  { id: "r2", name: "B", phone: "01033334444", selectedSlotIds: ["s2", "s3"], ownerUid: null, editTokenHash: "y", createdAt: "", updatedAt: "" },
];

describe("buildMatrixModel", () => {
  const tz = "Asia/Seoul";

  it("preserves slot order from event", () => {
    const m = buildMatrixModel(event, responses, tz);
    expect(m.slotColumns.map((c) => c.slotId)).toEqual(["s1", "s2", "s3"]);
  });

  it("renders slot labels in viewer TZ (HH:mm)", () => {
    const m = buildMatrixModel(event, responses, tz);
    expect(m.slotColumns.map((c) => c.timeLabel)).toEqual(["14:00", "14:30", "15:00"]);
  });

  it("groups slots by date label", () => {
    const m = buildMatrixModel(event, responses, tz);
    expect(m.slotColumns.every((c) => c.dateLabel === "4/22 (수)")).toBe(true);
  });

  it("produces one row per response with checkmark set", () => {
    const m = buildMatrixModel(event, responses, tz);
    expect(m.rows).toHaveLength(2);
    expect(m.rows[0]?.name).toBe("A");
    expect(m.rows[0]?.checks.s1).toBe(true);
    expect(m.rows[0]?.checks.s2).toBe(true);
    expect(m.rows[0]?.checks.s3).toBe(false);
    expect(m.rows[1]?.checks.s3).toBe(true);
  });

  it("computes per-slot participant count", () => {
    const m = buildMatrixModel(event, responses, tz);
    expect(m.slotCounts.s1).toBe(1);
    expect(m.slotCounts.s2).toBe(2);
    expect(m.slotCounts.s3).toBe(1);
  });

  it("handles empty responses", () => {
    const m = buildMatrixModel(event, [], tz);
    expect(m.rows).toEqual([]);
    expect(m.slotCounts.s1).toBe(0);
  });

  it("ignores response slotIds that no longer exist on event", () => {
    const stale: ParticipantResponse[] = [
      { id: "r_stale", name: "X", phone: "01099990000", selectedSlotIds: ["s1", "s_deleted"], ownerUid: null, editTokenHash: "z", createdAt: "", updatedAt: "" },
    ];
    const m = buildMatrixModel(event, stale, tz);
    expect(m.rows[0]?.checks.s1).toBe(true);
    expect("s_deleted" in (m.rows[0]?.checks ?? {})).toBe(false);
  });
});
