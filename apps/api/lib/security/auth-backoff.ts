import { rateLimited } from "@/lib/api-response";

interface BackoffState {
  failures: number;
  blockedUntil: number;
}

const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 60_000;
const BACKOFF_STORE = new Map<string, BackoffState>();

function getDelayMs(failures: number): number {
  const exponential = BACKOFF_BASE_MS * Math.pow(2, Math.max(0, failures - 1));
  return Math.min(BACKOFF_MAX_MS, exponential);
}

export function getAuthBackoffKey(ip: string, identifier?: string): string {
  const suffix = identifier?.trim().toLowerCase() || "unknown";
  return `${ip}:${suffix}`;
}

export function enforceAuthBackoff(key: string): Response | null {
  const state = BACKOFF_STORE.get(key);
  if (!state) return null;

  const now = Date.now();
  if (state.blockedUntil <= now) return null;

  const retryAfterSeconds = Math.ceil((state.blockedUntil - now) / 1000);
  const response = rateLimited(`Too many attempts. Try again in ${retryAfterSeconds} seconds.`);
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

export function recordAuthFailure(key: string): void {
  const current = BACKOFF_STORE.get(key);
  const failures = (current?.failures ?? 0) + 1;
  const delayMs = getDelayMs(failures);
  BACKOFF_STORE.set(key, {
    failures,
    blockedUntil: Date.now() + delayMs,
  });
}

export function recordAuthSuccess(key: string): void {
  BACKOFF_STORE.delete(key);
}
