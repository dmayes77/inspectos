import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

function deriveHash(password: string, salt: string): string {
  return scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
}

export function hashAgentPortalPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = deriveHash(password, salt);
  return `${salt}:${hash}`;
}

export function verifyAgentPortalPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const expectedHash = Buffer.from(hash, "hex");
  const actualHash = Buffer.from(deriveHash(password, salt), "hex");
  if (expectedHash.length !== actualHash.length) return false;
  return timingSafeEqual(expectedHash, actualHash);
}
