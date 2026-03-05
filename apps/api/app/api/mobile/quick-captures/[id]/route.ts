import type { NextRequest } from 'next/server';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';
import {
  badRequest,
  createServiceClient,
  createUserClient,
  getAccessToken,
  getUserFromToken,
  serverError,
  unauthorized,
} from '@/lib/supabase';

type MembershipRow = {
  role: string;
  profiles: { id?: string; is_inspector?: boolean } | { id?: string; is_inspector?: boolean }[] | null;
};

type QuickCaptureRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  note: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  storage_path: string;
  created_at: string;
};

const QUICK_CAPTURE_BUCKET = 'quick-captures';

function normalizeProfile(row: MembershipRow): { id?: string; is_inspector?: boolean } | null {
  const profile = row.profiles;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile ?? null;
}

async function resolveTenantIdForBusiness(
  supabase: ReturnType<typeof createUserClient>,
  businessIdentifier: string
): Promise<string | null> {
  const { data: tenantBySlug, error: tenantSlugError } = await supabase
    .from('tenants')
    .select('id, business_id')
    .eq('slug', businessIdentifier)
    .maybeSingle();

  const tenantByBusinessId = !tenantBySlug
    ? await supabase
        .from('tenants')
        .select('id, business_id')
        .eq('business_id', businessIdentifier.toUpperCase())
        .maybeSingle()
    : { data: null, error: null };

  const tenant = tenantBySlug ?? tenantByBusinessId.data;
  const tenantError = tenantBySlug ? tenantSlugError : tenantByBusinessId.error;

  if (tenantError || !tenant?.id) return null;
  return tenant.id;
}

async function verifyInspectorMembership(
  supabase: ReturnType<typeof createUserClient>,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const { data: membershipRaw, error: membershipError } = await supabase
    .from('tenant_members')
    .select('role, profiles!left(id, is_inspector)')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membershipRaw) return false;

  const membership = membershipRaw as MembershipRow;
  const profile = normalizeProfile(membership);

  return (
    membership.role === 'owner' ||
    membership.role === 'admin' ||
    membership.role === 'inspector' ||
    Boolean(profile?.is_inspector)
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return applyCorsHeaders(unauthorized('Missing access token'), request);
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return applyCorsHeaders(unauthorized('Invalid access token'), request);
    }

    const { id } = await context.params;
    if (!id) {
      return applyCorsHeaders(badRequest('Capture id is required'), request);
    }

    const businessIdentifier = request.nextUrl.searchParams.get('business');
    if (!businessIdentifier) {
      return applyCorsHeaders(badRequest('Missing business parameter'), request);
    }

    const supabase = createUserClient(accessToken);
    const serviceClient = createServiceClient();

    const tenantId = await resolveTenantIdForBusiness(supabase, businessIdentifier);
    if (!tenantId) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const hasInspectorAccess = await verifyInspectorMembership(supabase, tenantId, user.userId);
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const { data, error } = await supabase
      .from('quick_capture_media')
      .select('id, tenant_id, user_id, name, note, captured_at, latitude, longitude, accuracy_meters, storage_path, created_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('user_id', user.userId)
      .maybeSingle();

    if (error) {
      return applyCorsHeaders(serverError('Failed to load quick capture', error), request);
    }

    if (!data) {
      return applyCorsHeaders(badRequest('Quick capture not found'), request);
    }

    const row = data as QuickCaptureRow;

    const { data: signedData, error: signedError } = await serviceClient.storage
      .from(QUICK_CAPTURE_BUCKET)
      .createSignedUrl(row.storage_path, 60 * 60);

    if (signedError || !signedData?.signedUrl) {
      return applyCorsHeaders(serverError('Failed to sign quick capture URL', signedError), request);
    }

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          item: {
            ...row,
            image_url: signedData.signedUrl,
          },
        },
      }),
      request
    );
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to load quick capture', error), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, OPTIONS');
}
