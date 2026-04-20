import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type {
  SubmitResponseInput,
  SubmitResponseOutput,
  GetResponseInput,
  GetResponseOutput,
  DeleteEventInput,
  DeleteEventOutput,
  UpdateEventSlotsInput,
  UpdateEventSlotsOutput,
} from "@meetplan/shared";

export const submitResponseCallable = httpsCallable<SubmitResponseInput, SubmitResponseOutput>(
  functions,
  "submitResponse"
);

export const getResponseCallable = httpsCallable<GetResponseInput, GetResponseOutput>(
  functions,
  "getResponse"
);

export const deleteEventCallable = httpsCallable<DeleteEventInput, DeleteEventOutput>(
  functions,
  "deleteEvent"
);

export const updateEventSlotsCallable = httpsCallable<UpdateEventSlotsInput, UpdateEventSlotsOutput>(
  functions,
  "updateEventSlots"
);
