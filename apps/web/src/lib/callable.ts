import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import type {
  SubmitResponseInput,
  SubmitResponseOutput,
  GetResponseInput,
  GetResponseOutput,
} from "@meetplan/shared";

export const submitResponseCallable = httpsCallable<SubmitResponseInput, SubmitResponseOutput>(
  functions,
  "submitResponse"
);

export const getResponseCallable = httpsCallable<GetResponseInput, GetResponseOutput>(
  functions,
  "getResponse"
);
