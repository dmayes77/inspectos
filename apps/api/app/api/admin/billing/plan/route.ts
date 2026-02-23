import { badRequest, serverError, success } from "@/lib/supabase";
import { requirePermission, withAuth } from "@/lib/api/with-auth";
import {
  BILLING_PLAN_DEFAULTS,
  STRIPE_BASE_PRICE_ENV_BY_PLAN,
  STRIPE_SEAT_PRICE_ENV_BY_PLAN,
  normalizePlanCode,
  type PlanCode,
} from "@/lib/billing/plans";

type ChangePlanBody = {
  planCode?: PlanCode;
};

type TenantBillingSettings = {
  planCode?: string;
  stripePlanCode?: string;
  inspectorSeatCount?: number;
  stripeSubscriptionId?: string;
  includedInspectors?: number;
  maxInspectors?: number;
  baseMonthlyPrice?: number;
  additionalInspectorPrice?: number;
  [key: string]: unknown;
};

type StripeSubscriptionItem = {
  id?: string;
  price?: { id?: string };
};

function resolveCurrentPlanCode(billing: TenantBillingSettings): PlanCode {
  return (
    normalizePlanCode(billing.planCode) ??
    normalizePlanCode(billing.stripePlanCode) ??
    "growth"
  );
}

function getActiveSeatCount(billing: TenantBillingSettings, currentPlan: PlanCode): number {
  const included = BILLING_PLAN_DEFAULTS[currentPlan].includedInspectors;
  const max = BILLING_PLAN_DEFAULTS[currentPlan].maxInspectors;
  const value = Number(billing.inspectorSeatCount ?? included);
  if (!Number.isFinite(value)) return included;
  return Math.max(included, Math.min(max, Math.round(value)));
}

function getPriceIdForPlan(planCode: PlanCode): { basePriceId: string | null; seatPriceId: string | null } {
  return {
    basePriceId: process.env[STRIPE_BASE_PRICE_ENV_BY_PLAN[planCode]] ?? null,
    seatPriceId: process.env[STRIPE_SEAT_PRICE_ENV_BY_PLAN[planCode]] ?? null,
  };
}

function readItems(payload: unknown): StripeSubscriptionItem[] {
  const sub = payload as { items?: { data?: StripeSubscriptionItem[] } } | null;
  return Array.isArray(sub?.items?.data) ? sub.items.data : [];
}

export const POST = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions, request }) => {
  const permissionCheck = requirePermission(
    memberRole,
    "edit_settings",
    "You do not have permission to change billing plans",
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return serverError("Stripe is not configured", new Error("Missing STRIPE_SECRET_KEY"));
  }

  const body = (await request.json().catch(() => ({}))) as ChangePlanBody;
  const targetPlanCode = normalizePlanCode(body.planCode);
  if (!targetPlanCode) {
    return badRequest("A valid target plan code is required.");
  }

  const { data: tenantData, error: tenantError } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();
  if (tenantError) {
    return serverError("Failed to load current billing settings", tenantError);
  }

  const currentSettings = (tenantData?.settings ?? {}) as { billing?: TenantBillingSettings };
  const currentBilling = (currentSettings.billing ?? {}) as TenantBillingSettings;
  const currentPlanCode = resolveCurrentPlanCode(currentBilling);
  if (currentPlanCode === targetPlanCode) {
    return success({ changed: false, message: "Already on selected plan." });
  }

  const subscriptionId =
    typeof currentBilling.stripeSubscriptionId === "string" ? currentBilling.stripeSubscriptionId.trim() : "";
  if (!subscriptionId) {
    return badRequest("No active Stripe subscription is linked to this business.");
  }

  const currentSelectedSeats = getActiveSeatCount(currentBilling, currentPlanCode);
  const targetPlan = BILLING_PLAN_DEFAULTS[targetPlanCode];
  if (currentSelectedSeats > targetPlan.maxInspectors) {
    return badRequest(
      `Current purchased seats (${currentSelectedSeats}) exceed ${targetPlan.name} max (${targetPlan.maxInspectors}). Lower seats first.`
    );
  }

  const { basePriceId, seatPriceId } = getPriceIdForPlan(targetPlanCode);
  if (!basePriceId) {
    return serverError("Target plan base price is not configured", new Error(`Missing ${STRIPE_BASE_PRICE_ENV_BY_PLAN[targetPlanCode]}`));
  }
  if (currentSelectedSeats > targetPlan.includedInspectors && !seatPriceId) {
    return serverError("Target plan seat add-on price is not configured", new Error(`Missing ${STRIPE_SEAT_PRICE_ENV_BY_PLAN[targetPlanCode]}`));
  }

  const currentBasePriceIds = new Set([
    process.env[STRIPE_BASE_PRICE_ENV_BY_PLAN.growth],
    process.env[STRIPE_BASE_PRICE_ENV_BY_PLAN.team],
  ].filter((value): value is string => typeof value === "string" && value.length > 0));
  const currentSeatPriceIds = new Set([
    process.env[STRIPE_SEAT_PRICE_ENV_BY_PLAN.growth],
    process.env[STRIPE_SEAT_PRICE_ENV_BY_PLAN.team],
  ].filter((value): value is string => typeof value === "string" && value.length > 0));

  const subscriptionResponse = await fetch(
    `https://api.stripe.com/v1/subscriptions/${subscriptionId}?expand[]=items.data.price`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    }
  );
  const subscriptionPayload = (await subscriptionResponse.json().catch(() => ({}))) as {
    error?: { message?: string };
    [key: string]: unknown;
  };
  if (!subscriptionResponse.ok) {
    return serverError(
      subscriptionPayload.error?.message || "Failed to load Stripe subscription",
      new Error(subscriptionPayload.error?.message || "Stripe subscription fetch failed")
    );
  }

  const items = readItems(subscriptionPayload);
  const baseItem = items.find((item) => item.price?.id && currentBasePriceIds.has(item.price.id));
  if (!baseItem?.id) {
    return badRequest("Unable to locate current base plan item on Stripe subscription.");
  }
  const existingSeatItem = items.find((item) => item.price?.id && currentSeatPriceIds.has(item.price.id));
  const targetSeatQuantity = Math.max(0, currentSelectedSeats - targetPlan.includedInspectors);

  const params = new URLSearchParams();
  params.append("proration_behavior", "create_prorations");
  params.append("items[0][id]", baseItem.id);
  params.append("items[0][price]", basePriceId);
  params.append("items[0][quantity]", "1");

  if (targetSeatQuantity > 0 && seatPriceId) {
    if (existingSeatItem?.id) {
      params.append("items[1][id]", existingSeatItem.id);
      params.append("items[1][price]", seatPriceId);
      params.append("items[1][quantity]", String(targetSeatQuantity));
    } else {
      params.append("items[1][price]", seatPriceId);
      params.append("items[1][quantity]", String(targetSeatQuantity));
    }
  } else if (existingSeatItem?.id) {
    params.append("items[1][id]", existingSeatItem.id);
    params.append("items[1][deleted]", "true");
  }

  const updateResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const updatePayload = (await updateResponse.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  if (!updateResponse.ok) {
    return serverError(
      updatePayload.error?.message || "Failed to update Stripe subscription plan",
      new Error(updatePayload.error?.message || "Stripe subscription update failed")
    );
  }

  const mergedSettings = {
    ...currentSettings,
    billing: {
      ...currentBilling,
      planCode: targetPlan.code,
      planName: targetPlan.name,
      baseMonthlyPrice: targetPlan.baseMonthlyPrice,
      includedInspectors: targetPlan.includedInspectors,
      maxInspectors: targetPlan.maxInspectors,
      additionalInspectorPrice: targetPlan.additionalInspectorPrice,
      inspectorSeatCount: currentSelectedSeats,
      stripePlanCode: targetPlan.code,
      stripeSeatQuantity: targetSeatQuantity,
      stripePlanChangedAt: new Date().toISOString(),
    },
  };

  const { error: updateTenantError } = await serviceClient
    .from("tenants")
    .update({ settings: mergedSettings })
    .eq("id", tenant.id);
  if (updateTenantError) {
    return serverError("Stripe updated but failed to persist tenant billing settings", updateTenantError);
  }

  return success({
    changed: true,
    planCode: targetPlan.code,
    planName: targetPlan.name,
    selectedInspectorSeats: currentSelectedSeats,
    seatQuantity: targetSeatQuantity,
  });
});
