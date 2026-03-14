export type TenantAccessRow = {
  id: string;
  slug?: string;
  name?: string;
  business_id?: string | null;
};

export type MembershipProfileRow = {
  id?: string;
  is_inspector?: boolean;
};

export type InspectorMembershipRow = {
  role: string;
  profiles: MembershipProfileRow | MembershipProfileRow[] | null;
};

export type OrderLookup = {
  column: string;
  value: string;
};

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string, options?: Record<string, unknown>) => any;
  };
};

export async function resolveTenantForBusinessIdentifier<TTenant extends TenantAccessRow = TenantAccessRow>(
  supabase: SupabaseLike,
  businessIdentifier: string,
  selectColumns = 'id, slug, business_id'
): Promise<TTenant | null> {
  const { data: tenantBySlug, error: tenantSlugError } = await supabase
    .from('tenants')
    .select(selectColumns)
    .eq('slug', businessIdentifier)
    .maybeSingle();

  const tenantByBusinessId = !tenantBySlug
    ? await supabase
        .from('tenants')
        .select(selectColumns)
        .eq('business_id', businessIdentifier.toUpperCase())
        .maybeSingle()
    : { data: null, error: null };

  const tenant = (tenantBySlug ?? tenantByBusinessId.data) as TTenant | null;
  const tenantError = tenantBySlug ? tenantSlugError : tenantByBusinessId.error;
  if (tenantError || !tenant) {
    return null;
  }

  return tenant;
}

export function normalizeMembershipProfile(
  profile: MembershipProfileRow | MembershipProfileRow[] | null
): MembershipProfileRow | null {
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile ?? null;
}

export function hasInspectorSeatAccess(role: string, isInspectorFlag?: boolean): boolean {
  return role === 'owner' || role === 'admin' || role === 'inspector' || Boolean(isInspectorFlag);
}

export function buildInspectorScopeUserIds(userId: string, profileId?: string): string[] {
  if (!profileId || profileId === userId) {
    return [userId];
  }

  return [userId, profileId];
}

export async function resolveInspectorMembership(
  supabase: SupabaseLike,
  tenantId: string,
  userId: string
): Promise<{ role: string; profileId?: string; isInspectorFlag: boolean } | null> {
  const { data: membershipRaw, error: membershipError } = await supabase
    .from('tenant_members')
    .select('role, profiles!left(id, is_inspector)')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membershipRaw) {
    return null;
  }

  const membership = membershipRaw as InspectorMembershipRow;
  const profile = normalizeMembershipProfile(membership.profiles);

  return {
    role: membership.role,
    profileId: profile?.id,
    isInspectorFlag: Boolean(profile?.is_inspector),
  };
}

export async function resolveOrderForTenantLookup<TOrder>(
  supabase: SupabaseLike,
  tenantId: string,
  lookup: OrderLookup,
  selectColumns: string,
  inspectorIds?: string[]
): Promise<TOrder | null> {
  let query = supabase
    .from('orders')
    .select(selectColumns)
    .eq(lookup.column, lookup.value)
    .eq('tenant_id', tenantId);

  if (inspectorIds && inspectorIds.length > 0) {
    query = query.in('inspector_id', inspectorIds);
  }

  const { data: order, error: orderError } = await query.limit(1).maybeSingle();
  if (orderError || !order) {
    return null;
  }

  return order as TOrder;
}

export async function resolveOrderIdForTenantLookup(
  supabase: SupabaseLike,
  tenantId: string,
  lookup: OrderLookup
): Promise<string | null> {
  const order = await resolveOrderForTenantLookup<{ id: string }>(
    supabase,
    tenantId,
    lookup,
    'id'
  );

  return order?.id ?? null;
}
