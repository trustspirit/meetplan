import { describe, it, expect } from "vitest";
import { generateToken, hashToken, verifyToken } from "../src/lib/tokens";

describe("generateToken", () => {
  it("returns a 36-char UUID v4", () => {
    const t = generateToken();
    expect(t).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("is unique across calls", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});

describe("hashToken / verifyToken", () => {
  it("hashes a token deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("returns 64-char hex sha256", () => {
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifyToken returns true for correct token", () => {
    const raw = "my-raw-token";
    const hash = hashToken(raw);
    expect(verifyToken(raw, hash)).toBe(true);
  });

  it("verifyToken returns false for wrong token", () => {
    const hash = hashToken("real");
    expect(verifyToken("fake", hash)).toBe(false);
  });
});
