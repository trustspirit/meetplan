export interface Slot {
  id: string;
  start: string; // ISO-8601 UTC instant
  end: string;
}

export type EventStatus = "open" | "closed";
export type EventType = "meeting" | "ward_visit";

export interface WardAssignment {
  wardId: string;
  wardName: string;
  date: string; // YYYY-MM-DD
}

/** 호스트가 이벤트 생성 시 정의하는 추가 수집 항목. 한 줄 텍스트만 지원한다. */
export interface ResponseField {
  id: string;      // 이벤트 내 고유
  label: string;   // 1~40자
  required: boolean;
}

export interface MeetplanEvent {
  id: string;
  ownerUid: string;
  title: string;
  description?: string;
  periodMinutes: number;
  timezone: string;
  slots: Slot[];
  status: EventStatus;
  createdAt: string; // ISO
  updatedAt: string;
  // ward_visit fields
  eventType?: EventType;
  stakeId?: string;
  wardVisitDates?: string[]; // YYYY-MM-DD[]
  // 응답 수집 항목 — 생성 시에만 설정된다.
  // undefined는 이 기능 이전에 만들어진 이벤트를 뜻한다. eventCollectsPhone() /
  // eventResponseFields()로만 해석하고 필드를 직접 읽지 않는다.
  collectPhone?: boolean;
  responseFields?: ResponseField[];
}

export interface ParticipantResponse {
  id: string;
  name: string;
  phone?: string;                    // collectPhone이 꺼진 이벤트에서는 없다
  answers?: Record<string, string>;  // fieldId -> 답변
  note?: string;
  selectedSlotIds: string[];
  ownerUid: string | null;
  editTokenHash: string | null;
  createdAt: string;
  updatedAt: string;
  wardAssignments?: WardAssignment[]; // for ward_visit events
}
