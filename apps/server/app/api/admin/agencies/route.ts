import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success,
  validationError
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';
import { createAgencySchema } from '@/lib/validations/agency';

/**
 * GET /api/admin/agencies
 *
 * Fetches agencies for the tenant
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
 * - status: filter by status (optional)
 * - search: search by name or email (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to fetch agencies', error);
  }
}

/**
 * POST /api/admin/agencies
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const body = await request.json();

    // Validate request body
    const validation = createAgencySchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.issues[0]?.message || 'Validation failed');
    }
    const payload = validation.data;

    const tenantSlug = body.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to create agency', error);
  }
}
