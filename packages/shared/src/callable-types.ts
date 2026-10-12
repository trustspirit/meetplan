import { z } from "zod";
import { responseSubmitSchema, type ResponseSubmitInput } from "./validation";

// Alias: Callable 관점의 네이밍으로 제공하되 스키마는 공유
export const submitResponseInputSchema = responseSubmitSchema;
export type SubmitResponseInput = ResponseSubmitInput;

export interface SubmitResponseOutput {
  responseId: string;
  rawToken?: string; // 신규 익명 제출 시에만 포함
}

export const getResponseInputSchema = z.object({
  eventId: z.string().min(1),
  rid: z.string().optional(),
  token: z.string().optional(),
});

export type GetResponseInput = z.infer<typeof getResponseInputSchema>;

export interface GetResponseOutput {
  found: boolean;
  response?: {
    id: string;
    name: string;
    phone?: string;
    answers?: Record<string, string>;
    note?: string;
    selectedSlotIds: string[];
    wardAssignments?: { wardId: string; wardName: string; date: string }[];
    updatedAt: string;
  };
}

export const deleteEventInputSchema = z.object({
  eventId: z.string().min(1),
});

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>;

export interface DeleteEventOutput {
  deletedResponses: number;
}

const slotInputSchema = z.object({
  id: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const updateEventSlotsInputSchema = z.object({
  eventId: z.string().min(1),
  slots: z.array(slotInputSchema).min(1),
});

export type UpdateEventSlotsInput = z.infer<typeof updateEventSlotsInputSchema>;

export interface UpdateEventSlotsOutput {
  affectedResponses: number;
}

// 호스트가 응답하지 않은 참가자를 대신해 이름과 가능한 슬롯을 직접 입력한다.
export const hostAddResponseInputSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  selectedSlotIds: z.array(z.string().min(1)).min(1),
});

export type HostAddResponseInput = z.infer<typeof hostAddResponseInputSchema>;

export interface HostAddResponseOutput {
  responseId: string;
}

// 호스트가 직접 추가한 응답만 지울 수 있다. 참가자가 낸 응답은 건드리지 않는다.
export const hostDeleteResponseInputSchema = z.object({
  eventId: z.string().min(1),
  responseId: z.string().min(1),
});

export type HostDeleteResponseInput = z.infer<typeof hostDeleteResponseInputSchema>;

export interface HostDeleteResponseOutput {
  deleted: boolean;
}
