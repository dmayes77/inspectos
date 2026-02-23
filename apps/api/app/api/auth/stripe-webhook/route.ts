import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyStripeWebhookSignature } from "@/lib/billing/stripe-webhook";

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
};

function toIsoFromUnix(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return new Date(value * 1000).toISOString();
}

type StripeSubscriptionSnapshot = {
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  status: string | null;
};

async function fetchSubscriptionSnapshot(subscriptionId: string): Promise<StripeSubscriptionSnapshot | null> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey || !subscriptionId) return null;

  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  });

  if (!response.ok) return null;

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    currentPeriodStart: toIsoFromUnix(payload.current_period_start),
    currentPeriodEnd: toIsoFromUnix(payload.current_period_end),
    cancelAt: toIsoFromUnix(payload.cancel_at),
    trialEnd: toIsoFromUnix(payload.trial_end),
    cancelAtPeriodEnd: Boolean(payload.cancel_at_period_end),
    status: typeof payload.status === "string" ? payload.status : null,
  };
}

function extractTenantIdFromObject(obj: Record<string, unknown> | undefined): string | null {
  const metadata = (obj?.metadata as Record<string, unknown> | undefined) ?? {};
  const tenantId = metadata.tenant_id;
  return typeof tenantId === "string" && tenantId.trim() ? tenantId : null;
}

function mergeBillingStatus(
  currentSettings: Record<string, unknown> | null | undefined,
  updates: Record<string, unknown>
): Record<string, unknown> {
  const existing = currentSettings ?? {};
  const existingBilling = ((existing.billing as Record<string, unknown> | undefined) ?? {});

  return {
    ...existing,
    billing: {
      ...existingBilling,
      ...updates,
      stripeLastWebhookAt: new Date().toISOString(),
    },
  };
}

async function updateTenantBillingSettings(tenantId: string, updates: Record<string, unknown>): Promise<void> {
  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  const merged = mergeBillingStatus((tenant?.settings as Record<string, unknown> | undefined) ?? {}, updates);
  await supabaseAdmin.from("tenants").update({ settings: merged }).eq("id", tenantId);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const payload = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");
  const isValid = verifyStripeWebhookSignature({
    payload,
    signatureHeader,
    webhookSecret,
  });

  if (!isValid) {
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return Response.json({ error: "Invalid Stripe payload" }, { status: 400 });
  }

  const object = (event.data?.object ?? {}) as Record<string, unknown>;

  switch (event.type) {
    case "checkout.session.completed": {
      const tenantId = extractTenantIdFromObject(object);
      const subscriptionId = typeof object.subscription === "string" ? object.subscription : null;
      const customerId = typeof object.customer === "string" ? object.customer : null;
      const subscriptionSnapshot = subscriptionId
        ? await fetchSubscriptionSnapshot(subscriptionId)
        : null;

      if (tenantId) {
        await updateTenantBillingSettings(tenantId, {
          subscriptionStatus: subscriptionSnapshot?.status ?? "trialing",
          paymentMethodOnFile: true,
          stripeCheckoutCompletedAt: new Date().toISOString(),
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          stripeCurrentPeriodStart: subscriptionSnapshot?.currentPeriodStart ?? null,
          stripeCurrentPeriodEnd: subscriptionSnapshot?.currentPeriodEnd ?? null,
          stripeCancelAt: subscriptionSnapshot?.cancelAt ?? null,
          stripeTrialEnd: subscriptionSnapshot?.trialEnd ?? null,
          stripeCancelAtPeriodEnd: subscriptionSnapshot?.cancelAtPeriodEnd ?? false,
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      const tenantId = extractTenantIdFromObject(object);
      const status = typeof object.status === "string" ? object.status : null;
      const subscriptionId = typeof object.id === "string" ? object.id : null;
      const customerId = typeof object.customer === "string" ? object.customer : null;
      const currentPeriodStart = toIsoFromUnix(object.current_period_start);
      const currentPeriodEnd = toIsoFromUnix(object.current_period_end);
      const cancelAt = toIsoFromUnix(object.cancel_at);
      const trialEnd = toIsoFromUnix(object.trial_end);
      const cancelAtPeriodEnd = Boolean(object.cancel_at_period_end);

      if (tenantId && status) {
        await updateTenantBillingSettings(tenantId, {
          subscriptionStatus: status,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          stripeCurrentPeriodStart: currentPeriodStart,
          stripeCurrentPeriodEnd: currentPeriodEnd,
          stripeCancelAt: cancelAt,
          stripeTrialEnd: trialEnd,
          stripeCancelAtPeriodEnd: cancelAtPeriodEnd,
          paymentMethodOnFile: status !== "incomplete_expired",
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const tenantId = extractTenantIdFromObject(object);
      if (tenantId) {
        await updateTenantBillingSettings(tenantId, {
          subscriptionStatus: "past_due",
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const tenantId = extractTenantIdFromObject(object);
      if (tenantId) {
        await updateTenantBillingSettings(tenantId, {
          subscriptionStatus: "active",
          paymentMethodOnFile: true,
        });
      }
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true, eventId: event.id, type: event.type });
}
