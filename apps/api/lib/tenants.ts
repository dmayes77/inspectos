import type { SupabaseClient } from '@supabase/supabase-js';

type TenantRecord = {
  id: string;
  name: string;
  slug: string;
};

export async function resolveTenant(
  supabase: SupabaseClient,
  userId: string,
  tenantSlug?: string | null
): Promise<{ tenant: TenantRecord | null; error?: Error }> {
  if (tenantSlug) {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', tenantSlug)
      .single();

    if (error) {
      return { tenant: null, error };
    }

    return { tenant: tenant as TenantRecord };
  }

  const { data: membership, error } = await supabase
    .from('tenant_members')
    .select('tenant:tenants(id, name, slug)')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !membership) {
    return { tenant: null, error: error || new Error('Tenant membership not found') };
  }

  const tenant = (membership as { tenant: TenantRecord | null }).tenant;
  if (!tenant) {
    return { tenant: null, error: new Error('Tenant not found') };
  }

  return { tenant };
}
