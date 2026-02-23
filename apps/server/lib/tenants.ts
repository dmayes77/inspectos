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

export async function resolveTenant(
  supabase: SupabaseClient,
  userId: string,
  tenantIdentifier?: string | null,
): Promise<{ tenant: TenantRecord | null; role?: TenantMemberRole; error?: Error }> {
  const { data: memberships, error: membershipCountError } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(2);

  if (membershipCountError) {
    return { tenant: null, error: membershipCountError };
  }

  if ((memberships?.length ?? 0) > 1) {
    return {
      tenant: null,
      error: new Error("Account is linked to multiple businesses. Tenant isolation violation."),
    };
  }

  const requestedIdentifier = tenantIdentifier?.trim();

  if (requestedIdentifier) {
    const identifierLower = requestedIdentifier.toLowerCase();
    const identifierUpper = requestedIdentifier.toUpperCase();

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, slug, business_id")
      .or(`slug.eq.${identifierLower},business_id.eq.${identifierUpper},id.eq.${requestedIdentifier}`)
      .maybeSingle();

    if (tenantError || !tenant) {
      return { tenant: null, error: tenantError || new Error("Tenant not found") };
    }

    const { data: membership, error: membershipError } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("user_id", userId)
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return { tenant: null, error: membershipError || new Error("Tenant membership not found") };
    }

    const role = normalizeRole((membership as { role?: string }).role);
    if (!role) {
      return { tenant: null, error: new Error("Tenant role not found") };
    }

    return { tenant: tenant as TenantRecord, role };
  }

  const { data: membership, error } = await supabase
    .from("tenant_members")
    .select("role, tenant:tenants(id, name, slug, business_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
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
