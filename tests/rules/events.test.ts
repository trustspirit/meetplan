import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

// ESM 환경이라 __dirname 없음
const rulesPath = fileURLToPath(new URL("../../firestore.rules", import.meta.url));

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "meetplan-test",
    firestore: {
      rules: readFileSync(rulesPath, "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => { await testEnv.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

const EV = {
  ownerUid: "host1",
  title: "T",
  periodMinutes: 30,
  timezone: "Asia/Seoul",
  slots: [{ id: "s_1", start: "2026-04-22T05:00:00.000Z", end: "2026-04-22T05:30:00.000Z" }],
  status: "open",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("events rules", () => {
  it("anyone can read an event", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "events/e1"), EV);
    });
    await assertSucceeds(getDoc(doc(testEnv.unauthenticatedContext().firestore(), "events/e1")));
  });

  it("unauthed cannot create", async () => {
    await assertFails(setDoc(doc(testEnv.unauthenticatedContext().firestore(), "events/e1"), EV));
  });

  it("authed host can create for themselves", async () => {
    const ctx = testEnv.authenticatedContext("host1");
    await assertSucceeds(setDoc(doc(ctx.firestore(), "events/e1"), EV));
  });

  it("authed user cannot create for someone else", async () => {
    const ctx = testEnv.authenticatedContext("host2");
    await assertFails(setDoc(doc(ctx.firestore(), "events/e1"), EV));
  });

  it("owner can update non-slot fields", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "events/e1"), EV);
    });
    const ctx = testEnv.authenticatedContext("host1");
    await assertSucceeds(updateDoc(doc(ctx.firestore(), "events/e1"), { title: "T2" }));
  });

  it("owner cannot change slots directly", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "events/e1"), EV);
    });
    const ctx = testEnv.authenticatedContext("host1");
    await assertFails(
      updateDoc(doc(ctx.firestore(), "events/e1"), {
        slots: [{ id: "s_new", start: "x", end: "y" }],
      })
    );
  });

  it("cannot delete from client", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "events/e1"), EV);
    });
    const ctx = testEnv.authenticatedContext("host1");
    await assertFails(deleteDoc(doc(ctx.firestore(), "events/e1")));
  });
});
