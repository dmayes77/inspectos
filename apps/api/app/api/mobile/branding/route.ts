import { badRequest, notFound, success, serverError, createServiceClient } from '@/lib/supabase';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';
import type { NextRequest } from 'next/server';

type TenantSettings = {
  branding?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  } | null;
};

/**
 * GET /api/mobile/branding
 * Lightweight branding payload for inspector mobile theming.
 * Public by business slug to avoid auth startup races on mobile.
 */
export async function GET(request: NextRequest) {
  const business = request.nextUrl.searchParams.get('business')?.trim().toLowerCase();
  if (!business) {
    return applyCorsHeaders(badRequest('Missing business parameter'), request);
  }

  const serviceClient = createServiceClient();
  const { data: tenant, error: tenantError } = await serviceClient
    .from('tenants')
    .select('id')
    .eq('slug', business)
    .maybeSingle();

  if (tenantError) {
    return applyCorsHeaders(serverError('Failed to load business', tenantError), request);
  }
  if (!tenant?.id) {
    return applyCorsHeaders(notFound('Business not found'), request);
  }

  const { data, error } = await serviceClient
    .from('tenants')
    .select('settings')
    .eq('id', tenant.id as string)
    .maybeSingle();

  if (error) {
    return applyCorsHeaders(serverError('Failed to load branding settings', error), request);
  }

  const settings = (data?.settings ?? {}) as TenantSettings;
  const branding = settings.branding ?? {};

  return applyCorsHeaders(success({
    branding: {
      logoUrl: branding.logoUrl ?? null,
      primaryColor: branding.primaryColor ?? '#2563eb',
      secondaryColor: branding.secondaryColor ?? '#06b6d4',
    },
  }), request);
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, OPTIONS');
}
