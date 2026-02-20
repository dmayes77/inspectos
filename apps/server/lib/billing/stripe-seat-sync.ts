import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BILLING_PLAN_DEFAULTS,
  normalizePlanCode,
  STRIPE_SEAT_PRICE_ENV_BY_PLAN,
  type PlanCode,
} from "@/lib/billing/plans";

type TenantSettings = {
  billing?: {
    planCode?: string;
    stripePlanCode?: string;
    includedInspectors?: number;
    stripeSubscriptionId?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type StripeListItem = {
  id?: string;
  price?: { id?: string };
};

type SeatSyncResult =
  | { status: "synced"; inspectorSeatCount: number; seatQuantity: number }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

function getStripeApiKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key?.trim() ? key : null;
}

function getBilling(settings: TenantSettings | null | undefined) {
  return settings?.billing ?? {};
}

function resolvePlanCode(billing: ReturnType<typeof getBilling>): PlanCode | null {
  return normalizePlanCode(billing.planCode) ?? normalizePlanCode(billing.stripePlanCode);
}

async function countInspectorSeats(serviceClient: SupabaseClient, tenantId: string): Promise<number> {
  const { count, error } = await serviceClient
    .from("tenant_members")
    .select("user_id, profiles!inner(id)", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("profiles.is_inspector", true);

  if (error) {
    throw new Error(`Failed to count inspector seats: ${error.message}`);
  }

  return count ?? 0;
}

async function getTenantSettings(serviceClient: SupabaseClient, tenantId: string): Promise<TenantSettings> {
  const { data, error } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load tenant settings: ${error.message}`);
  }

  return (data?.settings ?? {}) as TenantSettings;
}

async function updateTenantBillingSettings(
  serviceClient: SupabaseClient,
  tenantId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const settings = await getTenantSettings(serviceClient, tenantId);
  const billing = getBilling(settings);
  const mergedSettings = {
    ...settings,
    billing: {
      ...billing,
      ...updates,
    },
  };

  const { error } = await serviceClient
    .from("tenants")
    .update({ settings: mergedSettings })
    .eq("id", tenantId);

  if (error) {
    throw new Error(`Failed to update tenant billing settings: ${error.message}`);
  }
}

async function stripeRequest(args: {
  apiKey: string;
  path: string;
  method?: "GET" | "POST" | "DELETE";
  params?: URLSearchParams;
}): Promise<unknown> {
  const method = args.method ?? "GET";
  const baseUrl = "https://api.stripe.com/v1";
  const url = method === "GET" || method === "DELETE"
    ? `${baseUrl}${args.path}${args.params ? `?${args.params.toString()}` : ""}`
    : `${baseUrl}${args.path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? args.params?.toString() : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    [key: string]: unknown;
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Stripe request failed (${response.status})`);
  }

  return payload;
}

function readSubscriptionItems(subscriptionPayload: unknown): StripeListItem[] {
  const sub = subscriptionPayload as { items?: { data?: StripeListItem[] } } | null;
  return Array.isArray(sub?.items?.data) ? sub.items.data : [];
}

export async function syncStripeSeatQuantityForTenant(
  serviceClient: SupabaseClient,
  tenantId: string
): Promise<SeatSyncResult> {
  try {
    const apiKey = getStripeApiKey();
    if (!apiKey) {
      return { status: "skipped", reason: "STRIPE_SECRET_KEY is not configured" };
    }

    const settings = await getTenantSettings(serviceClient, tenantId);
    const billing = getBilling(settings);
    const planCode = resolvePlanCode(billing);
    if (!planCode) {
      return { status: "skipped", reason: "Business plan does not support seat sync" };
    }

    const subscriptionId =
      typeof billing.stripeSubscriptionId === "string" ? billing.stripeSubscriptionId.trim() : "";
    if (!subscriptionId) {
      return { status: "skipped", reason: "No active Stripe subscription on tenant" };
    }

    const seatPriceEnv = STRIPE_SEAT_PRICE_ENV_BY_PLAN[planCode];
    const seatPriceId = process.env[seatPriceEnv];
    if (!seatPriceId) {
      throw new Error(`Missing ${seatPriceEnv} for plan ${planCode}`);
    }

    const inspectorSeatCount = await countInspectorSeats(serviceClient, tenantId);
    const includedInspectors = Math.max(
      0,
      Number(
        billing.includedInspectors ??
          BILLING_PLAN_DEFAULTS[planCode].includedInspectors
      )
    );
    const seatQuantity = Math.max(0, inspectorSeatCount - includedInspectors);

    const subscription = await stripeRequest({
      apiKey,
      path: `/subscriptions/${subscriptionId}`,
      params: new URLSearchParams([["expand[]", "items.data.price"]]),
    });
    const items = readSubscriptionItems(subscription);
    const seatItem = items.find((item) => item.price?.id === seatPriceId);

    if (seatQuantity > 0) {
      if (seatItem?.id) {
        await stripeRequest({
          apiKey,
          path: `/subscription_items/${seatItem.id}`,
          method: "POST",
          params: new URLSearchParams({
            quantity: String(seatQuantity),
            proration_behavior: "create_prorations",
          }),
        });
      } else {
        await stripeRequest({
          apiKey,
          path: "/subscription_items",
          method: "POST",
          params: new URLSearchParams({
            subscription: subscriptionId,
            price: seatPriceId,
            quantity: String(seatQuantity),
            proration_behavior: "create_prorations",
          }),
        });
      }
    } else if (seatItem?.id) {
      await stripeRequest({
        apiKey,
        path: `/subscription_items/${seatItem.id}`,
        method: "DELETE",
        params: new URLSearchParams({
          proration_behavior: "create_prorations",
        }),
      });
    }

    await updateTenantBillingSettings(serviceClient, tenantId, {
      stripeSeatQuantity: seatQuantity,
      stripeInspectorSeatCount: inspectorSeatCount,
      stripeSeatSyncedAt: new Date().toISOString(),
      stripeSeatSyncLastError: null,
    });

    return { status: "synced", inspectorSeatCount, seatQuantity };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown seat sync error";
    try {
      await updateTenantBillingSettings(serviceClient, tenantId, {
        stripeSeatSyncLastError: message,
        stripeSeatSyncFailedAt: new Date().toISOString(),
      });
    } catch {
      // Avoid masking the primary sync failure.
    }
    return { status: "failed", error: message };
  }
}
