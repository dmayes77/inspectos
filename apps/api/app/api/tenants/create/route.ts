import { createClient } from "@supabase/supabase-js";
import { generateBusinessApiKey, hashBusinessApiKey } from "@/lib/api/business-api-keys";
import { RateLimitPresets, rateLimitByIP } from "@/lib/rate-limit";
import { enforceAuthBackoff, getAuthBackoffKey, recordAuthFailure, recordAuthSuccess } from "@/lib/security/auth-backoff";
import { getRequestIp, recordAuthAuditEvent } from "@/lib/security/auth-audit";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const ip = getRequestIp(req);
  const route = new URL(req.url).pathname;
  const method = req.method;

  const rateLimitResponse = rateLimitByIP(req, RateLimitPresets.auth);
  if (rateLimitResponse) {
    recordAuthAuditEvent({
      type: "rate_limited",
      statusCode: 429,
      route,
      method,
      ip,
      reason: "tenant_create_rate_limit_ip",
    });
    return rateLimitResponse;
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const backoffKey = getAuthBackoffKey(ip, token?.slice(0, 24));
  const backoffResponse = enforceAuthBackoff(backoffKey);
  if (backoffResponse) {
    recordAuthAuditEvent({
      type: "rate_limited",
      statusCode: 429,
      route,
      method,
      ip,
      reason: "tenant_create_auth_backoff",
    });
    return backoffResponse;
  }

  const fail = (status: 400 | 401 | 409, message: string): Response => {
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

  if (!token) return fail(401, "Missing bearer token");

  const supabaseUser = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
  if (userErr || !userData.user) return fail(401, "Invalid token");

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "").trim().toLowerCase();

  if (!name || !slug) return fail(400, "name and slug are required");
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    return fail(400, "slug must be 3-40 chars: lowercase letters, numbers, hyphen");
  }

  const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (existingMembershipError) {
    return fail(400, existingMembershipError.message);
  }

  if (existingMembership) {
    return fail(409, "This account is already linked to a business");
  }

  const { data: tenant, error: tErr } = await supabaseAdmin
    .from("tenants")
    .insert({ name, slug })
    .select("id, name, slug, business_id")
    .single();

  if (tErr) return fail(400, tErr.message);

  const { error: mErr } = await supabaseAdmin
    .from("tenant_members")
    .insert({ tenant_id: tenant.id, user_id: userData.user.id, role: "owner" });

  if (mErr) return fail(400, mErr.message);

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

  if (apiKeyError) return fail(400, apiKeyError.message);

  recordAuthSuccess(backoffKey);
  recordAuthAuditEvent({
    type: "auth_success",
    statusCode: 200,
    route,
    method,
    ip,
    userId: userData.user.id,
    tenantId: tenant.id,
    reason: "tenant_created",
  });

  return Response.json({ business: tenant });
}
