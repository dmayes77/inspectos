import type { SupabaseClient } from "@supabase/supabase-js";

type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  business_id?: string;
};

export type TenantMemberRole = "owner" | "admin" | "inspector" | "viewer" | "member";

function normalizeRole(role: string | null | undefined): TenantMemberRole | null {
  if (!role) return null;
  const value = role.toLowerCase();
  if (value === "owner" || value === "admin" || value === "inspector" || value === "viewer" || value === "member") {
    return value;
  }
  return null;
}

// Only enable BYPASS_AUTH in development mode for security
// Supports: local dev, Vercel preview, and custom dev deployments (dev.inspectos.co)
const IS_DEVELOPMENT =
  process.env.NODE_ENV === 'development' ||
  process.env.VERCEL_ENV === 'preview' ||
  process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true';
const BYPASS_AUTH = IS_DEVELOPMENT && process.env.BYPASS_AUTH === 'true';
// Backward compatibility: older env docs used SUPABASE_TENANT_ID.
const BYPASS_BUSINESS_ID = IS_DEVELOPMENT
  ? (process.env.SUPABASE_BUSINESS_ID ?? process.env.SUPABASE_TENANT_ID)?.toUpperCase()
  : undefined;

export async function resolveTenant(
  supabase: SupabaseClient,
  userId: string,
  tenantIdentifier?: string | null,
): Promise<{ tenant: TenantRecord | null; role?: TenantMemberRole; error?: Error }> {
  // When BYPASS_AUTH is enabled, use business/tenant identifier from environment
  if (BYPASS_AUTH && BYPASS_BUSINESS_ID) {
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, slug, business_id")
      .eq("business_id", BYPASS_BUSINESS_ID)
      .single();

    if (error) {
      return { tenant: null, error };
    }

    return { tenant: tenant as TenantRecord, role: "owner" };
  }

  const requestedIdentifier = tenantIdentifier?.trim();
  if (requestedIdentifier) {
    const { data: tenantBySlug, error: tenantBySlugError } = await supabase
      .from("tenants")
      .select("id, name, slug, business_id")
      .eq("slug", requestedIdentifier)
      .maybeSingle();

    const tenantByBusinessId = !tenantBySlug
      ? await supabase
          .from("tenants")
          .select("id, name, slug, business_id")
          .eq("business_id", requestedIdentifier.toUpperCase())
          .maybeSingle()
      : { data: null, error: null };

    const selectedTenant = tenantBySlug ?? tenantByBusinessId.data;
    const selectedTenantError = tenantBySlug ? tenantBySlugError : tenantByBusinessId.error;

    // If a specific business identifier is requested and exists, require membership.
    if (!selectedTenantError && selectedTenant) {
      const { data: membership, error: membershipError } = await supabase
        .from("tenant_members")
        .select("id, role")
        .eq("user_id", userId)
        .eq("tenant_id", selectedTenant.id)
        .maybeSingle();

      if (membershipError || !membership) {
        return { tenant: null, error: membershipError || new Error("Tenant membership not found") };
      }

      const role = normalizeRole((membership as { role?: string } | null)?.role);
      if (!role) {
        return { tenant: null, error: new Error("Tenant role not found") };
      }

      return { tenant: selectedTenant as TenantRecord, role };
    }
  }

  const { data: membership, error } = await supabase
    .from("tenant_members")
    .select("role, tenant:tenants(id, name, slug, business_id)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !membership) {
    return { tenant: null, error: error || new Error("Tenant membership not found") };
  }

  const tenantData = Array.isArray(membership.tenant) ? membership.tenant[0] : membership.tenant;
  const tenant = tenantData as TenantRecord | null;
  if (!tenant) {
    return { tenant: null, error: new Error("Tenant not found") };
  }

  const role = normalizeRole((membership as { role?: string }).role);
  if (!role) {
    return { tenant: null, error: new Error("Tenant role not found") };
  }

  return { tenant, role };
}
