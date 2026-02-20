import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { RateLimitPresets, rateLimitByIP } from "@/lib/rate-limit";
import { getRequestIp, recordAuthAuditEvent } from "@/lib/security/auth-audit";
import {
  BILLING_PLAN_DEFAULTS,
  STRIPE_BASE_PRICE_ENV_BY_PLAN,
  STRIPE_SEAT_PRICE_ENV_BY_PLAN,
  type PlanCode,
} from "@/lib/billing/plans";

type CheckoutBody = {
  tenant_id?: string;
  plan_code?: PlanCode;
  trial_days?: number;
};

function getWebBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

async function countInspectorSeats(tenantId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("tenant_members")
    .select("user_id, profiles!inner(id)", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("profiles.is_inspector", true);

  if (error) {
    throw new Error(`Failed to count inspector seats: ${error.message}`);
  }

  return count ?? 0;
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const route = request.nextUrl.pathname;
  const method = request.method;

  const rateLimitResponse = rateLimitByIP(request, RateLimitPresets.auth);
  if (rateLimitResponse) {
    recordAuthAuditEvent({
      type: "rate_limited",
      statusCode: 429,
      route,
      method,
      ip,
      reason: "stripe_checkout_rate_limit",
    });
    return rateLimitResponse;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!accessToken) {
    return Response.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  const user = userResult?.user;
  if (userError || !user) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const tenantId = body.tenant_id?.trim();
  const planCode = body.plan_code ?? "growth";
  const trialDays = Math.max(1, Math.min(60, Number(body.trial_days ?? 30)));

  if (!tenantId) {
    return Response.json({ error: "tenant_id is required" }, { status: 400 });
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return Response.json({ error: "Not a member of this business" }, { status: 403 });
  }

  const role = (membership as { role?: string }).role?.toLowerCase();
  if (role !== "owner" && role !== "admin") {
    return Response.json({ error: "Only business admins can configure billing" }, { status: 403 });
  }

  const { data: tenantData, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("id, slug, business_id, name")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantError || !tenantData) {
    return Response.json({ error: "Business not found" }, { status: 404 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const basePriceEnvName = STRIPE_BASE_PRICE_ENV_BY_PLAN[planCode];
  const basePriceId = process.env[basePriceEnvName];
  if (!stripeSecretKey || !basePriceId) {
    return Response.json(
      { error: "Stripe is not configured. Missing STRIPE_SECRET_KEY or plan price IDs." },
      { status: 500 }
    );
  }

  const includedInspectors = BILLING_PLAN_DEFAULTS[planCode].includedInspectors;
  let additionalSeatQuantity = 0;
  try {
    const inspectorSeatCount = await countInspectorSeats(tenantId);
    additionalSeatQuantity = Math.max(0, inspectorSeatCount - includedInspectors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve inspector seats";
    return Response.json({ error: message }, { status: 500 });
  }

  const seatPriceEnvName = STRIPE_SEAT_PRICE_ENV_BY_PLAN[planCode];
  const seatPriceId = process.env[seatPriceEnvName];
  if (additionalSeatQuantity > 0 && !seatPriceId) {
    return Response.json(
      { error: `Stripe is not configured. Missing ${seatPriceEnvName} for seat billing.` },
      { status: 500 }
    );
  }

  const baseUrl = getWebBaseUrl();
  const successUrl = `${baseUrl}/app/overview?stripe=success`;
  const cancelUrl = `${baseUrl}/register?stripe=cancel`;

  const params = new URLSearchParams();
  params.append("mode", "subscription");
  params.append("line_items[0][price]", basePriceId);
  params.append("line_items[0][quantity]", "1");
  if (additionalSeatQuantity > 0 && seatPriceId) {
    params.append("line_items[1][price]", seatPriceId);
    params.append("line_items[1][quantity]", String(additionalSeatQuantity));
  }
  params.append("customer_email", user.email ?? "");
  params.append("allow_promotion_codes", "true");
  params.append("payment_method_collection", "always");
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("subscription_data[trial_period_days]", String(trialDays));
  params.append("subscription_data[metadata][tenant_id]", tenantId);
  params.append("subscription_data[metadata][user_id]", user.id);
  params.append("subscription_data[metadata][plan_code]", planCode);
  params.append("metadata[tenant_id]", tenantId);
  params.append("metadata[user_id]", user.id);
  params.append("metadata[plan_code]", planCode);
  params.append("metadata[additional_seat_quantity]", String(additionalSeatQuantity));
  if (tenantData.business_id) {
    params.append("metadata[business_id]", tenantData.business_id);
  }

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const stripePayload = (await stripeResponse.json().catch(() => ({}))) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!stripeResponse.ok || !stripePayload.url || !stripePayload.id) {
    const message = stripePayload.error?.message || "Failed to create Stripe Checkout session";
    return Response.json({ error: message }, { status: 500 });
  }

  const { data: currentTenant } = await supabaseAdmin
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  const currentSettings = (currentTenant?.settings ?? {}) as { billing?: Record<string, unknown> };
  const updatedSettings = {
    ...currentSettings,
    billing: {
      ...currentSettings.billing,
      stripeCheckoutSessionId: stripePayload.id,
      stripeCheckoutCreatedAt: new Date().toISOString(),
      stripePlanCode: planCode,
    },
  };

  await supabaseAdmin.from("tenants").update({ settings: updatedSettings }).eq("id", tenantId);

  return Response.json({
    data: {
      id: stripePayload.id,
      url: stripePayload.url,
    },
  });
}
