import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';
import { validateRequestBody } from '@/lib/api/validate';
import { updateVendorSchema } from '@/lib/validations/vendor';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/vendors/[id]
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

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Vendor not found.', error);
    }

    return success({
      id: data.id,
      name: data.name,
      vendorType: data.vendor_type ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    return serverError('Failed to fetch vendor', error);
  }
}

/**
 * PUT /api/admin/vendors/[id]
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

    const validation = await validateRequestBody(request, updateVendorSchema);
    if (validation.error) {
      return validation.error;
    }
    const payload = validation.data;

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const updateData: Record<string, string | null> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.vendor_type !== undefined) updateData.vendor_type = payload.vendor_type ?? null;
    if (payload.email !== undefined) updateData.email = payload.email ?? null;
    if (payload.phone !== undefined) updateData.phone = payload.phone ?? null;
    if (payload.status !== undefined) updateData.status = payload.status;

    const { data, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('id, name, vendor_type, email, phone, status')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to update vendor.', error);
    }

    return success({
      id: data.id,
      name: data.name,
      vendorType: data.vendor_type ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      status: data.status,
    });
  } catch (error) {
    return serverError('Failed to update vendor', error);
  }
}

/**
 * DELETE /api/admin/vendors/[id]
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
      .from('vendors')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) {
      return serverError(error.message ?? 'Failed to delete vendor.', error);
    }

    return success(true);
  } catch (error) {
    return serverError('Failed to delete vendor', error);
  }
}
