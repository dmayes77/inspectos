import { logger } from "@/lib/logger";

type AuthEventType =
  | "auth_success"
  | "auth_failure"
  | "authz_denied"
  | "billing_denied"
  | "rate_limited";

interface AuthAuditEvent {
  type: AuthEventType;
  statusCode: 200 | 400 | 401 | 402 | 403 | 409 | 429 | 500;
  route: string;
  method: string;
  requestId?: string;
  ip?: string;
  userId?: string;
  tenantId?: string;
  authType?: "user" | "api_key";
  reason?: string;
}

interface SpikeEntry {
  count: number;
  resetAt: number;
  lastAlertAt: number;
}

const SPIKE_WINDOW_MS = 5 * 60 * 1000;
const ALERT_COOLDOWN_MS = 2 * 60 * 1000;
const SPIKE_THRESHOLDS: Record<401 | 402 | 403 | 429, number> = {
  401: 20,
  402: 10,
  403: 12,
  429: 25,
};

const spikeStore = new Map<string, SpikeEntry>();

function nowMs(): number {
  return Date.now();
}

function getSpikeKey(event: AuthAuditEvent): string {
  const principal = event.tenantId ?? event.ip ?? "unknown";
  return `${event.statusCode}:${principal}`;
}

function getEventContext(event: AuthAuditEvent): Record<string, unknown> {
  return {
    statusCode: event.statusCode,
    route: event.route,
    method: event.method,
    requestId: event.requestId,
    ip: event.ip,
    userId: event.userId,
    tenantId: event.tenantId,
    authType: event.authType,
    reason: event.reason,
  };
}

function maybeEmitSpikeAlert(event: AuthAuditEvent): void {
  if (!(event.statusCode in SPIKE_THRESHOLDS)) return;

  const key = getSpikeKey(event);
  const current = spikeStore.get(key);
  const now = nowMs();

  if (!current || current.resetAt < now) {
    spikeStore.set(key, {
      count: 1,
      resetAt: now + SPIKE_WINDOW_MS,
      lastAlertAt: 0,
    });
    return;
  }

  current.count += 1;

  const threshold = SPIKE_THRESHOLDS[event.statusCode as 401 | 402 | 403 | 429];
  const canAlert = now - current.lastAlertAt > ALERT_COOLDOWN_MS;
  if (current.count >= threshold && canAlert) {
    current.lastAlertAt = now;
    logger.warn("Security auth spike detected", {
      ...getEventContext(event),
      spikeKey: key,
      spikeCount: current.count,
      threshold,
      windowSeconds: SPIKE_WINDOW_MS / 1000,
    });
  }
}

export function getRequestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function recordAuthAuditEvent(event: AuthAuditEvent): void {
  const logPayload = getEventContext(event);
  if (event.statusCode >= 400) {
    logger.warn("Auth security event", logPayload);
  } else {
    logger.info("Auth security event", logPayload);
  }
  maybeEmitSpikeAlert(event);
}
