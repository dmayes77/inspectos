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
  _tenantIdentifier?: string | null,
): Promise<{ tenant: TenantRecord | null; role?: TenantMemberRole; error?: Error }> {
  const { data: membership, error } = await supabase
    .from("tenant_members")
    .select("role, tenant:tenants(id, name, slug, business_id)")
    .eq("user_id", userId)
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
