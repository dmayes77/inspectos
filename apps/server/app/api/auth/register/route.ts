import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateBusinessApiKey, hashBusinessApiKey } from "@/lib/api/business-api-keys";
import { RateLimitPresets, rateLimitByIP } from "@/lib/rate-limit";
import { enforceAuthBackoff, getAuthBackoffKey, recordAuthFailure, recordAuthSuccess } from "@/lib/security/auth-backoff";
import { getRequestIp, recordAuthAuditEvent } from "@/lib/security/auth-audit";
import { BILLING_PLAN_DEFAULTS, type PlanCode } from "@/lib/billing/plans";

type RegisterBody = {
  email?: string;
  company_name: string;
  inspector_seat_count?: number;
  allow_existing_membership?: boolean;
  selected_plan?: {
    code?: PlanCode;
    name?: string;
    baseMonthlyPrice?: number;
    includedInspectors?: number;
    maxInspectors?: number;
    additionalInspectorPrice?: number;
  };
  trial?: {
    enabled?: boolean;
    days?: number;
    consented_to_trial?: boolean;
    consented_to_autopay?: boolean;
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

async function resolveUniqueTenantSlug(companyName: string): Promise<string> {
  const baseSlug = slugify(companyName) || "business";
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${baseSlug}${suffix}`.slice(0, 63);

    const { data: existingTenant, error } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to generate a unique company slug.");
    }

    if (!existingTenant) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`.slice(0, 63);
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
      reason: "register_rate_limit_ip",
    });
    return rateLimitResponse;
  }

  try {
    const body = (await request.json()) as RegisterBody;
    const { company_name, email } = body;
    const backoffKey = getAuthBackoffKey(ip, email);
    const backoffResponse = enforceAuthBackoff(backoffKey);
    if (backoffResponse) {
      recordAuthAuditEvent({
        type: "rate_limited",
        statusCode: 429,
        route,
        method,
        ip,
        reason: "register_auth_backoff",
      });
      return backoffResponse;
    }

    const fail = (status: 400 | 401 | 409 | 500, message: string): Response => {
      recordAuthFailure(backoffKey);
      recordAuthAuditEvent({
        type: status === 401 ? "auth_failure" : "authz_denied",
        statusCode: status,
        route,
        method,
        ip,
        reason: message,
      });
      return Response.json({ error: message }, { status });
    };

    if (!company_name) {
      return fail(400, "Missing required fields.");
    }

    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : null;

    let userId: string | null = null;
    if (email) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (profileError) {
        return fail(400, profileError.message || "Failed to find user profile.");
      }
      userId = profile?.id ?? null;
    }

    if (!userId && accessToken) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
        if (!userError && userData?.user?.id) {
          userId = userData.user.id;
        }
      } catch {
        // Ignore auth lookup errors and fall back to email-based resolution.
      }
    }

    if (!userId) {
      return fail(401, "Unable to resolve user for business creation.");
    }

    const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMembershipError) {
      return fail(400, existingMembershipError.message || "Failed to verify membership state.");
    }

    if (existingMembership) {
      if (!body.allow_existing_membership) {
        return fail(409, "This account is already linked to a business.");
      }

      const { data: existingTenant, error: existingTenantError } = await supabaseAdmin
        .from("tenants")
        .select("id, name, slug, business_id")
        .eq("id", existingMembership.tenant_id)
        .maybeSingle();

      if (existingTenantError || !existingTenant) {
        return fail(500, "Failed to load existing business.");
      }

      return Response.json({ data: { business: existingTenant, existing: true } });
    }

    const slug = await resolveUniqueTenantSlug(company_name);

    const requestedPlanCode = body.selected_plan?.code ?? "growth";
    const selectedPlan = BILLING_PLAN_DEFAULTS[requestedPlanCode] ?? BILLING_PLAN_DEFAULTS.growth;
    const trialDays = Math.max(1, Math.min(60, Number(body.trial?.days ?? 30)));
    const trialEnabled = body.trial?.enabled !== false;
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
    const inspectorSeatCount = Math.max(
      1,
      Math.min(
        selectedPlan.maxInspectors,
        Number(body.inspector_seat_count ?? selectedPlan.includedInspectors)
      )
    );

    const tenantSettings = {
      billing: {
        planCode: selectedPlan.code,
        planName: selectedPlan.name,
        currency: "USD",
        baseMonthlyPrice: selectedPlan.baseMonthlyPrice,
        includedInspectors: selectedPlan.includedInspectors,
        maxInspectors: selectedPlan.maxInspectors,
        additionalInspectorPrice: selectedPlan.additionalInspectorPrice,
        subscriptionStatus: trialEnabled ? "trialing" : "active",
        trialEnabled,
        trialDays,
        trialStartedAt: new Date().toISOString(),
        trialEndsAt,
        consentedToTrial: body.trial?.consented_to_trial === true,
        consentedToAutopay: body.trial?.consented_to_autopay === true,
        paymentMethodOnFile: false,
        inspectorSeatCount,
      },
    };

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: company_name,
        slug,
        settings: tenantSettings,
      })
      .select("id, name, slug, business_id")
      .single();

    if (tenantError || !tenant) {
      return fail(500, "Failed to create business.");
    }

    const { error: memberError } = await supabaseAdmin.from("tenant_members").insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      return fail(500, "Failed to link user to business.");
    }

    const initialApiKey = generateBusinessApiKey();
    const { error: apiKeyError } = await supabaseAdmin
      .from("business_api_keys")
      .insert({
        tenant_id: tenant.id,
        name: "Primary Key",
        key_prefix: initialApiKey.slice(0, 12),
        key_hash: hashBusinessApiKey(initialApiKey),
        scopes: ["admin:api"],
      });

    if (apiKeyError) {
      return fail(500, "Failed to provision API access.");
    }

    recordAuthSuccess(backoffKey);
    recordAuthAuditEvent({
      type: "auth_success",
      statusCode: 200,
      route,
      method,
      ip,
      userId,
      tenantId: tenant.id,
      reason: "business_registered",
    });

    return Response.json({ data: { business: tenant } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    recordAuthAuditEvent({
      type: "auth_failure",
      statusCode: 401,
      route,
      method,
      ip,
      reason: "register_unexpected_error",
    });
    return Response.json({ error: message }, { status: 500 });
  }
}
