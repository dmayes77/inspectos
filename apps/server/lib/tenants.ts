import type { SupabaseClient } from "@supabase/supabase-js";

type TenantRecord = {
  id: string;
  name: string;
  slug: string;
};

// Only enable BYPASS_AUTH in development mode for security
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const BYPASS_AUTH = IS_DEVELOPMENT && process.env.BYPASS_AUTH === 'true';
const BYPASS_TENANT_ID = IS_DEVELOPMENT ? process.env.SUPABASE_TENANT_ID : undefined;

export async function resolveTenant(
  supabase: SupabaseClient,
  userId: string,
  tenantSlug?: string | null,
): Promise<{ tenant: TenantRecord | null; error?: Error }> {
  // When BYPASS_AUTH is enabled, use the tenant ID from environment
  if (BYPASS_AUTH && BYPASS_TENANT_ID) {
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("id", BYPASS_TENANT_ID)
      .single();

    if (error) {
      return { tenant: null, error };
    }

    return { tenant: tenant as TenantRecord };
  }

  if (tenantSlug) {
    const { data: tenant, error } = await supabase.from("tenants").select("id, name, slug").eq("slug", tenantSlug).single();

    if (error) {
      return { tenant: null, error };
    }

    return { tenant: tenant as TenantRecord };
  }

  const { data: membership, error } = await supabase.from("tenant_members").select("tenant:tenants(id, name, slug)").eq("user_id", userId).limit(1).single();

  if (error || !membership) {
    return { tenant: null, error: error || new Error("Tenant membership not found") };
  }

  const tenantData = Array.isArray(membership.tenant) ? membership.tenant[0] : membership.tenant;
  const tenant = tenantData as TenantRecord | null;
  if (!tenant) {
    return { tenant: null, error: new Error("Tenant not found") };
  }

  return { tenant };
}
