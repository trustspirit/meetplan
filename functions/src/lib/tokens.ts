import { randomUUID, createHash, timingSafeEqual } from "node:crypto";

export function generateToken(): string {
  return randomUUID();
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function verifyToken(raw: string, expectedHash: string): boolean {
  const actualBuf = Buffer.from(hashToken(raw), "hex");
  const expectedBuf = Buffer.from(expectedHash, "hex");
  // Buffer length check handles mismatched hex decoding
  if (actualBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(actualBuf, expectedBuf);
}
