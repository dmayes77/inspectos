import { createHash } from "crypto";

export function computeRequestHash(payload: unknown): string {
  const json = JSON.stringify(payload ?? {});
  return createHash("sha256").update(json).digest("hex");
}
