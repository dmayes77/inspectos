import { createHmac, timingSafeEqual } from "crypto";

type StripeSignatureParts = {
  timestamp: string | null;
  signatures: string[];
};

function parseStripeSignatureHeader(value: string | null): StripeSignatureParts {
  if (!value) {
    return { timestamp: null, signatures: [] };
  }

  const entries = value.split(",").map((part) => part.trim());
  let timestamp: string | null = null;
  const signatures: string[] = [];

  for (const entry of entries) {
    const [key, rawValue] = entry.split("=");
    if (!key || !rawValue) continue;
    if (key === "t") {
      timestamp = rawValue;
    } else if (key === "v1") {
      signatures.push(rawValue);
    }
  }

  return { timestamp, signatures };
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export function verifyStripeWebhookSignature(args: {
  payload: string;
  signatureHeader: string | null;
  webhookSecret: string;
  toleranceSeconds?: number;
}): boolean {
  const { payload, signatureHeader, webhookSecret, toleranceSeconds = 300 } = args;
  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampNumber) > toleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((sig) => constantTimeEquals(sig, expectedSignature));
}
