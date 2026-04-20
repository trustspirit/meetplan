import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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

const R_ANON = {
  name: "김민수",
  phone: "01012345678",
  selectedSlotIds: ["s_1"],
  ownerUid: null,
  editTokenHash: "abc123hash",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const R_USER = {
  ...R_ANON,
  ownerUid: "participant1",
  editTokenHash: null,
};

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), "events/e1"), EV);
    await setDoc(doc(c.firestore(), "events/e1/responses/r_anon"), R_ANON);
    await setDoc(doc(c.firestore(), "events/e1/responses/r_user"), R_USER);
  });
}

describe("responses rules", () => {
  it("host can get any response", async () => {
    await seed();
    const ctx = testEnv.authenticatedContext("host1");
    await assertSucceeds(getDoc(doc(ctx.firestore(), "events/e1/responses/r_anon")));
    await assertSucceeds(getDoc(doc(ctx.firestore(), "events/e1/responses/r_user")));
  });

  it("host can list all responses", async () => {
    await seed();
    const ctx = testEnv.authenticatedContext("host1");
    await assertSucceeds(getDocs(collection(ctx.firestore(), "events/e1/responses")));
  });

  it("logged-in participant can get own response", async () => {
    await seed();
    const ctx = testEnv.authenticatedContext("participant1");
    await assertSucceeds(getDoc(doc(ctx.firestore(), "events/e1/responses/r_user")));
  });

  it("logged-in participant cannot get someone else's response", async () => {
    await seed();
    const ctx = testEnv.authenticatedContext("participant1");
    await assertFails(getDoc(doc(ctx.firestore(), "events/e1/responses/r_anon")));
  });

  it("unauthed cannot get any response", async () => {
    await seed();
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), "events/e1/responses/r_anon")));
    await assertFails(getDoc(doc(ctx.firestore(), "events/e1/responses/r_user")));
  });

  it("non-host cannot list responses", async () => {
    await seed();
    const ctx = testEnv.authenticatedContext("participant1");
    await assertFails(getDocs(collection(ctx.firestore(), "events/e1/responses")));
  });

  it("no client write allowed (even for host)", async () => {
    await seed();
    const ctx = testEnv.authenticatedContext("host1");
    await assertFails(
      setDoc(doc(ctx.firestore(), "events/e1/responses/r_new"), R_ANON)
    );
    await assertFails(
      updateDoc(doc(ctx.firestore(), "events/e1/responses/r_anon"), { name: "X" })
    );
    await assertFails(deleteDoc(doc(ctx.firestore(), "events/e1/responses/r_anon")));
  });
});
