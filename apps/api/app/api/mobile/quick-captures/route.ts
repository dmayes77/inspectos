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

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  business_id?: string | null;
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

async function resolveTenantForBusiness(
  supabase: ReturnType<typeof createUserClient>,
  businessIdentifier: string
): Promise<TenantRow | null> {
  const { data: tenantBySlug, error: tenantSlugError } = await supabase
    .from('tenants')
    .select('id, name, slug, business_id')
    .eq('slug', businessIdentifier)
    .maybeSingle();

  const tenantByBusinessId = !tenantBySlug
    ? await supabase
        .from('tenants')
        .select('id, name, slug, business_id')
        .eq('business_id', businessIdentifier.toUpperCase())
        .maybeSingle()
    : { data: null, error: null };

  const tenant = (tenantBySlug ?? tenantByBusinessId.data) as TenantRow | null;
  const tenantError = tenantBySlug ? tenantSlugError : tenantByBusinessId.error;
  if (tenantError || !tenant) {
    return null;
  }

  return tenant;
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

function sanitizeFileName(fileName: string): string {
  const clean = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return clean.length > 0 ? clean : 'capture';
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return applyCorsHeaders(unauthorized('Missing access token'), request);
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return applyCorsHeaders(unauthorized('Invalid access token'), request);
    }

    const businessIdentifier = request.nextUrl.searchParams.get('business');
    if (!businessIdentifier) {
      return applyCorsHeaders(badRequest('Missing business parameter'), request);
    }

    const supabase = createUserClient(accessToken);
    const serviceClient = createServiceClient();

    const tenant = await resolveTenantForBusiness(supabase, businessIdentifier);
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const hasInspectorAccess = await verifyInspectorMembership(supabase, tenant.id, user.userId);
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const { data, error } = await supabase
      .from('quick_capture_media')
      .select('id, tenant_id, user_id, name, note, captured_at, latitude, longitude, accuracy_meters, storage_path, created_at')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.userId)
      .order('captured_at', { ascending: false })
      .limit(200);

    if (error) {
      return applyCorsHeaders(serverError('Failed to load quick captures', error), request);
    }

    const rows = (data ?? []) as QuickCaptureRow[];

    const items = await Promise.all(
      rows.map(async (row) => {
        const { data: signed, error: signedError } = await serviceClient.storage
          .from(QUICK_CAPTURE_BUCKET)
          .createSignedUrl(row.storage_path, 60 * 60);

        if (signedError || !signed?.signedUrl) {
          return {
            ...row,
            image_url: '',
          };
        }

        return {
          ...row,
          image_url: signed.signedUrl,
        };
      })
    );

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          items,
        },
      }),
      request
    );
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to load quick captures', error), request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return applyCorsHeaders(unauthorized('Missing access token'), request);
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return applyCorsHeaders(unauthorized('Invalid access token'), request);
    }

    const businessIdentifier = request.nextUrl.searchParams.get('business');
    if (!businessIdentifier) {
      return applyCorsHeaders(badRequest('Missing business parameter'), request);
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return applyCorsHeaders(badRequest('Expected multipart/form-data payload'), request);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const note = String(formData.get('note') || '').trim();
    const capturedAtRaw = String(formData.get('captured_at') || '').trim();
    const latitude = Number(formData.get('latitude'));
    const longitude = Number(formData.get('longitude'));
    const accuracyRaw = formData.get('accuracy_meters');
    const accuracyMeters = accuracyRaw == null || accuracyRaw === '' ? null : Number(accuracyRaw);

    if (!(file instanceof File)) {
      return applyCorsHeaders(badRequest('Capture image file is required'), request);
    }

    if (!file.type.startsWith('image/')) {
      return applyCorsHeaders(badRequest('Only image files are allowed'), request);
    }

    if (file.size > 15 * 1024 * 1024) {
      return applyCorsHeaders(badRequest('Capture image too large (max 15MB)'), request);
    }

    if (!note) {
      return applyCorsHeaders(badRequest('Capture note is required'), request);
    }

    const capturedAtDate = new Date(capturedAtRaw);
    if (!capturedAtRaw || Number.isNaN(capturedAtDate.getTime())) {
      return applyCorsHeaders(badRequest('captured_at is required and must be valid ISO date'), request);
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return applyCorsHeaders(badRequest('Valid latitude and longitude are required'), request);
    }

    const supabase = createUserClient(accessToken);
    const serviceClient = createServiceClient();

    const tenant = await resolveTenantForBusiness(supabase, businessIdentifier);
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const hasInspectorAccess = await verifyInspectorMembership(supabase, tenant.id, user.userId);
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const captureId = crypto.randomUUID();
    const extension = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
    const rawBaseName = file.name.replace(/\.[^/.]+$/, '');
    const fileBaseName = sanitizeFileName(rawBaseName);
    const storagePath = `${user.userId}/${tenant.id}/${captureId}-${Date.now()}-${fileBaseName}.${extension}`;

    const { error: uploadError } = await serviceClient.storage
      .from(QUICK_CAPTURE_BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        cacheControl: '3600',
        contentType: file.type,
      });

    if (uploadError) {
      return applyCorsHeaders(serverError('Failed to upload quick capture image', uploadError), request);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('quick_capture_media')
      .insert({
        id: captureId,
        tenant_id: tenant.id,
        user_id: user.userId,
        name: `QC-${capturedAtDate.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`,
        note,
        captured_at: capturedAtDate.toISOString(),
        latitude,
        longitude,
        accuracy_meters: Number.isFinite(accuracyMeters as number) ? accuracyMeters : null,
        storage_path: storagePath,
      })
      .select('id, tenant_id, user_id, name, note, captured_at, latitude, longitude, accuracy_meters, storage_path, created_at')
      .single();

    if (insertError || !inserted) {
      await serviceClient.storage.from(QUICK_CAPTURE_BUCKET).remove([storagePath]);
      return applyCorsHeaders(serverError('Failed to save quick capture metadata', insertError), request);
    }

    const { data: signedData, error: signedError } = await serviceClient.storage
      .from(QUICK_CAPTURE_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);

    if (signedError || !signedData?.signedUrl) {
      return applyCorsHeaders(serverError('Failed to sign quick capture URL', signedError), request);
    }

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          item: {
            ...(inserted as QuickCaptureRow),
            image_url: signedData.signedUrl,
          },
        },
      }),
      request
    );
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to create quick capture', error), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, POST, OPTIONS');
}
