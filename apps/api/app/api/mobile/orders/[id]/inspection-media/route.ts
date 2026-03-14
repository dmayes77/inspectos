import type { NextRequest } from 'next/server';
import {
  hasInspectorSeatAccess,
  resolveInspectorMembership,
  resolveOrderIdForTenantLookup,
  resolveTenantForBusinessIdentifier,
} from '@inspectos/platform/mobile-orders-access';
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
import { resolveIdLookup } from '@/lib/identifiers/lookup';

type TenantRow = {
  id: string;
  slug: string;
  business_id?: string | null;
};

type MediaAssetRow = {
  id: string;
  tenant_id: string;
  order_id: string;
  answer_id?: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  caption?: string | null;
  created_at: string;
};

const INSPECTION_MEDIA_BUCKET = 'inspection-media';

function sanitizeFileName(fileName: string): string {
  const clean = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return clean.length > 0 ? clean : 'inspection-media';
}

function parseTemplateItemId(caption?: string | null): string | null {
  if (!caption) return null;
  const prefix = 'template_item_id:';
  if (!caption.startsWith(prefix)) return null;
  const value = caption.slice(prefix.length).trim();
  return value.length > 0 ? value : null;
}


export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const templateItemId = request.nextUrl.searchParams.get('template_item_id')?.trim() || null;

    const { id } = await context.params;
    if (!id) {
      return applyCorsHeaders(badRequest('Order id is required'), request);
    }

    const supabase = createUserClient(accessToken);
    const serviceClient = createServiceClient();

    const tenant = await resolveTenantForBusinessIdentifier<TenantRow>(
      supabase,
      businessIdentifier,
      'id, slug, business_id'
    );
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const membership = await resolveInspectorMembership(supabase, tenant.id, user.userId);
    const hasInspectorAccess = membership
      ? hasInspectorSeatAccess(membership.role, membership.isInspectorFlag)
      : false;
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const lookup = resolveIdLookup(id, {
      publicColumn: 'order_number',
      transformPublicValue: (value) => value.toUpperCase(),
    });
    const orderId = await resolveOrderIdForTenantLookup(supabase, tenant.id, lookup);
    if (!orderId) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    const { data, error } = await supabase
      .from('media_assets')
      .select('id, tenant_id, order_id, answer_id, storage_path, file_name, mime_type, file_size, caption, created_at')
      .eq('tenant_id', tenant.id)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      return applyCorsHeaders(serverError('Failed to load inspection media', error), request);
    }

    const rows = (data ?? []) as MediaAssetRow[];
    const filteredRows = templateItemId
      ? rows.filter((row) => parseTemplateItemId(row.caption) === templateItemId)
      : rows;

    const items = await Promise.all(
      filteredRows.map(async (row) => {
        const { data: signedData, error: signedError } = await serviceClient.storage
          .from(INSPECTION_MEDIA_BUCKET)
          .createSignedUrl(row.storage_path, 60 * 60);

        return {
          ...row,
          template_item_id: parseTemplateItemId(row.caption),
          image_url: signedError || !signedData?.signedUrl ? '' : signedData.signedUrl,
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
    return applyCorsHeaders(serverError('Failed to load inspection media', error), request);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params;
    if (!id) {
      return applyCorsHeaders(badRequest('Order id is required'), request);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const templateItemId = String(formData.get('template_item_id') || '').trim();
    const sectionId = String(formData.get('section_id') || '').trim();
    const capturedAtRaw = String(formData.get('captured_at') || '').trim();
    const latitude = Number(formData.get('latitude'));
    const longitude = Number(formData.get('longitude'));
    const accuracyRaw = formData.get('accuracy_meters');
    const accuracyMeters = accuracyRaw == null || accuracyRaw === '' ? null : Number(accuracyRaw);

    if (!(file instanceof File)) {
      return applyCorsHeaders(badRequest('Media file is required'), request);
    }
    if (!file.type.startsWith('image/')) {
      return applyCorsHeaders(badRequest('Only image files are allowed'), request);
    }
    if (file.size > 15 * 1024 * 1024) {
      return applyCorsHeaders(badRequest('Image too large (max 15MB)'), request);
    }
    if (!templateItemId) {
      return applyCorsHeaders(badRequest('template_item_id is required'), request);
    }
    if (!sectionId) {
      return applyCorsHeaders(badRequest('section_id is required'), request);
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

    const tenant = await resolveTenantForBusinessIdentifier<TenantRow>(
      supabase,
      businessIdentifier,
      'id, slug, business_id'
    );
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const membership = await resolveInspectorMembership(supabase, tenant.id, user.userId);
    const hasInspectorAccess = membership
      ? hasInspectorSeatAccess(membership.role, membership.isInspectorFlag)
      : false;
    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const lookup = resolveIdLookup(id, {
      publicColumn: 'order_number',
      transformPublicValue: (value) => value.toUpperCase(),
    });
    const orderId = await resolveOrderIdForTenantLookup(supabase, tenant.id, lookup);
    if (!orderId) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    let answerId: string | null = null;
    const { data: customItem } = await supabase
      .from('mobile_inspection_custom_items')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('order_id', orderId)
      .eq('id', templateItemId)
      .maybeSingle();

    if (!customItem) {
      const { data: existingAnswer } = await supabase
        .from('answers')
        .select('id')
        .eq('order_id', orderId)
        .eq('template_item_id', templateItemId)
        .limit(1)
        .maybeSingle();

      if (existingAnswer?.id) {
        answerId = existingAnswer.id as string;
      } else {
        const now = new Date().toISOString();
        const insertWithTenant = await supabase
          .from('answers')
          .insert({
            tenant_id: tenant.id,
            order_id: orderId,
            template_item_id: templateItemId,
            section_id: sectionId,
            value: null,
            notes: null,
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .single();

        let insertRow = insertWithTenant.data as { id?: string } | null;
        let insertError = insertWithTenant.error;

        if (
          insertError &&
          insertError.message.toLowerCase().includes('tenant_id') &&
          insertError.message.toLowerCase().includes('column')
        ) {
          const insertWithoutTenant = await supabase
            .from('answers')
            .insert({
              order_id: orderId,
              template_item_id: templateItemId,
              section_id: sectionId,
              value: null,
              notes: null,
              created_at: now,
              updated_at: now,
            })
            .select('id')
            .single();

          insertRow = insertWithoutTenant.data as { id?: string } | null;
          insertError = insertWithoutTenant.error;
        }

        if (insertError || !insertRow?.id) {
          return applyCorsHeaders(serverError('Failed to create answer for media', insertError), request);
        }

        answerId = insertRow.id;
      }
    }

    const mediaId = crypto.randomUUID();
    const extension = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
    const rawBaseName = file.name.replace(/\.[^/.]+$/, '');
    const fileBaseName = sanitizeFileName(rawBaseName);
    const storagePath = `${user.userId}/${tenant.id}/${orderId}/${templateItemId}/${mediaId}-${Date.now()}-${fileBaseName}.${extension}`;

    const { error: uploadError } = await serviceClient.storage
      .from(INSPECTION_MEDIA_BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        cacheControl: '3600',
        contentType: file.type,
      });

    if (uploadError) {
      return applyCorsHeaders(serverError('Failed to upload inspection media', uploadError), request);
    }

    const caption = `template_item_id:${templateItemId}`;
    const { data: inserted, error: insertMediaError } = await supabase
      .from('media_assets')
      .insert({
        id: mediaId,
        tenant_id: tenant.id,
        order_id: orderId,
        answer_id: answerId,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        caption,
        // keep capture metadata searchable in caption until media metadata column exists
      })
      .select('id, tenant_id, order_id, answer_id, storage_path, file_name, mime_type, file_size, caption, created_at')
      .single();

    if (insertMediaError || !inserted) {
      await serviceClient.storage.from(INSPECTION_MEDIA_BUCKET).remove([storagePath]);
      return applyCorsHeaders(serverError('Failed to save inspection media', insertMediaError), request);
    }

    const { data: signedData, error: signedError } = await serviceClient.storage
      .from(INSPECTION_MEDIA_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);

    if (signedError || !signedData?.signedUrl) {
      return applyCorsHeaders(serverError('Failed to sign inspection media URL', signedError), request);
    }

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          item: {
            ...(inserted as MediaAssetRow),
            template_item_id: templateItemId,
            captured_at: capturedAtDate.toISOString(),
            latitude,
            longitude,
            accuracy_meters: Number.isFinite(accuracyMeters as number) ? accuracyMeters : null,
            image_url: signedData.signedUrl,
          },
        },
      }),
      request
    );
  } catch (error) {
    return applyCorsHeaders(serverError('Failed to create inspection media', error), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, POST, OPTIONS');
}
