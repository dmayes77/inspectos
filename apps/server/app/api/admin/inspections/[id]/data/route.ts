import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  notFound,
  serverError,
  success
} from '@/lib/supabase';
import { createLogger, generateRequestId } from '@/lib/logger';
import { rateLimitByIP, RateLimitPresets } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/inspections/[id]/data
 *
 * Fetches all inspection data: answers, findings, signatures, and media
 * This is the main endpoint for viewing completed inspection details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'inspection-data' });

  const rateLimitResponse = rateLimitByIP(request, RateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token', { requestId });
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token', { requestId });
    }

    const supabase = createUserClient(accessToken);

    // Get inspection with full details
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select(`
        *,
        order:order_id(
          id,
          scheduled_date,
          scheduled_time,
          properties!property_id(
            id,
            address_line1,
            address_line2,
            city,
            state,
            zip_code,
            property_type,
            sqft,
            year_built,
            bedrooms,
            bathrooms
          ),
          clients!client_id(
            id,
            name,
            email,
            phone,
            company
          ),
          profiles!inspector_id(
            id,
            full_name,
            email,
            avatar_url
          )
        ),
        template:templates(
          id,
          name,
          description,
          template_sections(
            id,
            name,
            description,
            sort_order,
            template_items(
              id,
              name,
              description,
              item_type,
              options,
              is_required,
              sort_order
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (inspectionError) {
      if (inspectionError.code === 'PGRST116') {
        return notFound('Inspection not found');
      }
      log.error('Failed to fetch inspection', { inspectionId: id }, inspectionError);
      return serverError('Failed to fetch inspection', inspectionError, { requestId });
    }

    // Get answers
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select(`
        id,
        template_item_id,
        section_id,
        value,
        notes,
        created_at,
        updated_at
      `)
      .eq('inspection_id', id);

    if (answersError) {
      log.error('Failed to fetch answers', { inspectionId: id }, answersError);
    }

    // Get findings
    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select(`
        id,
        section_id,
        template_item_id,
        defect_library_id,
        title,
        description,
        severity,
        location,
        recommendation,
        estimated_cost_min,
        estimated_cost_max,
        created_at,
        updated_at,
        media:media_assets(id, storage_path, file_name, mime_type, caption)
      `)
      .eq('inspection_id', id)
      .order('severity', { ascending: false });

    if (findingsError) {
      log.error('Failed to fetch findings', { inspectionId: id }, findingsError);
    }

    // Get signatures
    const { data: signatures, error: signaturesError } = await supabase
      .from('signatures')
      .select(`
        id,
        signer_name,
        signer_type,
        signature_data,
        signed_at
      `)
      .eq('inspection_id', id)
      .order('signed_at', { ascending: true });

    if (signaturesError) {
      log.error('Failed to fetch signatures', { inspectionId: id }, signaturesError);
    }

    // Get media assets
    const { data: media, error: mediaError } = await supabase
      .from('media_assets')
      .select(`
        id,
        finding_id,
        answer_id,
        storage_path,
        file_name,
        mime_type,
        file_size,
        caption,
        created_at
      `)
      .eq('inspection_id', id)
      .order('created_at', { ascending: true });

    if (mediaError) {
      log.error('Failed to fetch media', { inspectionId: id }, mediaError);
    }

    log.info('Inspection data fetched', {
      inspectionId: id,
      answersCount: answers?.length || 0,
      findingsCount: findings?.length || 0,
      signaturesCount: signatures?.length || 0,
      mediaCount: media?.length || 0
    });

    return success({
      inspection,
      answers: answers || [],
      findings: findings || [],
      signatures: signatures || [],
      media: media || []
    });
  } catch (error) {
    log.error('Inspection data fetch failed', { requestId, inspectionId: id }, error);
    return serverError('Failed to fetch inspection data', error, { requestId });
  }
}
