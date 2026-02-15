import { serverError, success, validationError } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { createAgencySchema } from '@inspectos/shared/validations/agency';

/**
 * GET /api/admin/agencies
 *
 * Fetches agencies for the tenant
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
 * - status: filter by status (optional)
 * - search: search by name or email (optional)
 */
export const GET = withAuth(async ({ supabase, tenant, request }) => {
  let query = supabase
    .from('agencies')
    .select(`
      *,
      agents:agents(id, name, email, phone, status, total_referrals)
    `)
    .eq('tenant_id', tenant.id)
    .order('name', { ascending: true });

  const status = request.nextUrl.searchParams.get('status');
  if (status) {
    query = query.eq('status', status);
  }

  const search = request.nextUrl.searchParams.get('search');
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return serverError('Failed to fetch agencies', error);
  }

  return success(data || []);
});

/**
 * POST /api/admin/agencies
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const body = await request.json();

  // Validate request body
  const validation = createAgencySchema.safeParse(body);
  if (!validation.success) {
    return validationError(validation.error.issues[0]?.message || 'Validation failed');
  }
  const payload = validation.data;

  const { data: agency, error } = await supabase
    .from('agencies')
    .insert({
      tenant_id: tenant.id,
      name: payload.name,
      logo_url: payload.logo_url ?? null,
      license_number: payload.license_number ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      website: payload.website || null,
      address_line1: payload.address_line1 ?? null,
      address_line2: payload.address_line2 ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      zip_code: payload.zip_code ?? null,
      status: payload.status ?? 'active',
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error || !agency) {
    return serverError('Failed to create agency', error);
  }

  return success(agency);
});
