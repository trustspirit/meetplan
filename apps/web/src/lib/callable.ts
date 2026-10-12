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
  HostAddResponseInput,
  HostAddResponseOutput,
  HostDeleteResponseInput,
  HostDeleteResponseOutput,
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

export const hostAddResponseCallable = httpsCallable<HostAddResponseInput, HostAddResponseOutput>(
  functions,
  "hostAddResponse"
);

export const hostDeleteResponseCallable = httpsCallable<HostDeleteResponseInput, HostDeleteResponseOutput>(
  functions,
  "hostDeleteResponse"
);
