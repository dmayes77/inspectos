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
import { createAgentSchema } from '@/lib/validations/agent';
import { resolveAgencyAssociation } from '@/lib/agents/agency-helpers';

/**
 * GET /api/admin/agents
 *
 * Fetches agents for the tenant
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
 * - status: filter by status (optional)
 * - agency_id: filter by agency (optional)
 * - search: search by name, email, or phone (optional)
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
      .from('agents')
      .select(`
        *,
        agency:agencies(id, name, email, phone, website, address_line1, address_line2, city, state, zip_code)
      `)
      .eq('tenant_id', tenant.id)
      .order('name', { ascending: true });

    const status = request.nextUrl.searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    const agencyId = request.nextUrl.searchParams.get('agency_id');
    if (agencyId) {
      query = query.eq('agency_id', agencyId);
    }

    const search = request.nextUrl.searchParams.get('search');
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return serverError('Failed to fetch agents', error);
    }

    return success(data || []);
  } catch (error) {
    return serverError('Failed to fetch agents', error);
  }
}

/**
 * POST /api/admin/agents
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
    const validation = createAgentSchema.safeParse(body);
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

    // Resolve agency association
    let agencyId: string | null;
    try {
      agencyId = await resolveAgencyAssociation({
        tenantId: tenant.id,
        agencyId: payload.agency_id ?? null,
        agencyName: payload.agency_name ?? null,
        brandLogoUrl: payload.brand_logo_url ?? null,
        agencyAddress: payload.agency_address ?? null,
        agencyWebsite: payload.agency_website ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to prepare agency.';
      return serverError(message, error);
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        tenant_id: tenant.id,
        agency_id: agencyId,
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        role: payload.role ?? null,
        license_number: payload.license_number ?? null,
        status: payload.status ?? 'active',
        notes: payload.notes ?? null,
        preferred_report_format: payload.preferred_report_format ?? 'pdf',
        notify_on_schedule: payload.notify_on_schedule ?? true,
        notify_on_complete: payload.notify_on_complete ?? true,
        notify_on_report: payload.notify_on_report ?? true,
        avatar_url: payload.avatar_url ?? null,
        brand_logo_url: payload.brand_logo_url ?? null,
        agency_address: payload.agency_address ?? null,
      })
      .select(`
        *,
        agency:agencies(id, name, email, phone, website, address_line1, address_line2, city, state, zip_code)
      `)
      .single();

    if (error || !agent) {
      return serverError('Failed to create agent', error);
    }

    return success(agent);
  } catch (error) {
    return serverError('Failed to create agent', error);
  }
}
