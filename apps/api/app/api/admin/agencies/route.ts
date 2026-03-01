import { serverError, success, validationError } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { createAgencySchema } from '@inspectos/shared/validations/agency';
import { normalizePhoneForStorage } from '@/lib/phone/normalize';

const normalizeWebsite = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!sanitized) return null;
  return `https://${sanitized}`;
};

const normalizeDomain = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const domain = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    ?.trim()
    .toLowerCase();
  return domain || null;
};

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
  const normalizedWebsite = normalizeWebsite(payload.website ?? null);
  const normalizedDomain = normalizeDomain(normalizedWebsite);

  // Prevent duplicate agencies for the same tenant by website domain first, then name.
  if (normalizedDomain) {
    const { data: agenciesByWebsite, error: websiteLookupError } = await supabase
      .from('agencies')
      .select('*')
      .eq('tenant_id', tenant.id)
      .not('website', 'is', null)
      .order('created_at', { ascending: true });

    if (websiteLookupError) {
      return serverError('Failed to check existing agencies', websiteLookupError);
    }

    const existingByWebsite = agenciesByWebsite?.find((agency) => normalizeDomain(agency.website) === normalizedDomain) ?? null;
    if (existingByWebsite) {
      return success(existingByWebsite);
    }
  }

  const { data: agenciesByName, error: nameLookupError } = await supabase
    .from('agencies')
    .select('*')
    .eq('tenant_id', tenant.id)
    .ilike('name', payload.name.trim())
    .order('created_at', { ascending: true })
    .limit(1);

  if (nameLookupError) {
    return serverError('Failed to check existing agencies', nameLookupError);
  }

  const existingByName = agenciesByName?.[0] ?? null;
  if (existingByName) {
    return success(existingByName);
  }

  const { data: agency, error } = await supabase
    .from('agencies')
    .insert({
      tenant_id: tenant.id,
      name: payload.name,
      logo_url: payload.logo_url ?? null,
      license_number: payload.license_number ?? null,
      email: payload.email ?? null,
      phone: normalizePhoneForStorage(payload.phone),
      website: normalizedWebsite,
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
