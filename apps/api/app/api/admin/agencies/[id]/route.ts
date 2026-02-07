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
import { updateAgencySchema } from '@/lib/validations/agency';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/agencies/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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

    const { data: agency, error } = await supabase
      .from('agencies')
      .select(`
        *,
        agents:agents(id, name, email, phone, status, total_referrals, total_revenue)
      `)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (error || !agency) {
      return serverError('Agency not found', error);
    }

    return success(agency);
  } catch (error) {
    return serverError('Failed to fetch agency', error);
  }
}

/**
 * PUT /api/admin/agencies/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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
    const validation = updateAgencySchema.safeParse(body);
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

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.logo_url !== undefined) updateData.logo_url = payload.logo_url;
    if (payload.license_number !== undefined) updateData.license_number = payload.license_number;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.website !== undefined) updateData.website = payload.website || null;
    if (payload.address_line1 !== undefined) updateData.address_line1 = payload.address_line1;
    if (payload.address_line2 !== undefined) updateData.address_line2 = payload.address_line2;
    if (payload.city !== undefined) updateData.city = payload.city;
    if (payload.state !== undefined) updateData.state = payload.state;
    if (payload.zip_code !== undefined) updateData.zip_code = payload.zip_code;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.notes !== undefined) updateData.notes = payload.notes;

    const { data: agency, error } = await supabase
      .from('agencies')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select()
      .single();

    if (error || !agency) {
      return serverError('Failed to update agency', error);
    }

    return success(agency);
  } catch (error) {
    return serverError('Failed to update agency', error);
  }
}

/**
 * DELETE /api/admin/agencies/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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

    const { error } = await supabase
      .from('agencies')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) {
      return serverError('Failed to delete agency', error);
    }

    return success({ deleted: true });
  } catch (error) {
    return serverError('Failed to delete agency', error);
  }
}
