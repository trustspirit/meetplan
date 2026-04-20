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
    phone: string;
    selectedSlotIds: string[];
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
