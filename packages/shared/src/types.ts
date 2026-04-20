export interface Slot {
  id: string;
  start: string; // ISO-8601 UTC instant
  end: string;
}

export type EventStatus = "open" | "closed";

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
}

export interface ParticipantResponse {
  id: string;
  name: string;
  phone: string;
  selectedSlotIds: string[];
  ownerUid: string | null;
  editTokenHash: string | null;
  createdAt: string;
  updatedAt: string;
}
