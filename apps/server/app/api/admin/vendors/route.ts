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
import { createVendorSchema } from '@inspectos/shared/validations/vendor';

/**
 * GET /api/admin/vendors
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

    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, vendor_type, email, phone, status')
      .eq('tenant_id', tenant.id)
      .order('name');

    if (error) {
      return serverError('Failed to fetch vendors', error);
    }

    return success(
      (data ?? []).map((vendor: { id: string; name: string; vendor_type: string | null; email: string | null; phone: string | null; status: string }) => ({
        id: vendor.id,
        name: vendor.name,
        vendorType: vendor.vendor_type ?? undefined,
        email: vendor.email ?? undefined,
        phone: vendor.phone ?? undefined,
        status: vendor.status,
      }))
    );
  } catch (error) {
    return serverError('Failed to fetch vendors', error);
  }
}

/**
 * POST /api/admin/vendors
 */
export async function POST(request: Request) {
  try {
    const accessToken = getAccessToken(request as NextRequest);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const validation = await validateRequestBody(request, createVendorSchema);
    if (validation.error) {
      return validation.error;
    }
    const payload = validation.data;

    const tenantSlug = (request as NextRequest).nextUrl?.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        tenant_id: tenant.id,
        name: payload.name,
        vendor_type: payload.vendor_type ?? null,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        status: payload.status ?? 'active',
      })
      .select('id, name, vendor_type, email, phone, status')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to create vendor.', error);
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
    return serverError('Failed to create vendor', error);
  }
}
