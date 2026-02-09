import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success,
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

/**
 * GET /api/admin/inspections/[id]/data
 * Fetch inspection with all related data (answers, findings, signatures, media)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: inspectionId } = await params;

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

    const { tenant, error: tenantError } = await resolveTenant(
      supabase,
      user.userId,
      tenantSlug
    );

    if (tenantError || !tenant) {
      return badRequest('Tenant not found or access denied');
    }

    // Fetch inspection with related data
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select(`
        *,
        order:orders(
          id,
          scheduled_date,
          status,
          property:properties(
            id,
            address_line1,
            address_line2,
            city,
            state,
            zip_code,
            property_type
          ),
          client:clients(
            id,
            name,
            email,
            phone
          ),
          agent:agents(
            id,
            full_name,
            email,
            phone
          )
        ),
        inspector:profiles(
          id,
          full_name,
          email,
          avatar_url
        ),
        template:templates(
          id,
          name,
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
      .eq('id', inspectionId)
      .eq('tenant_id', tenant.id)
      .single();

    if (inspectionError || !inspection) {
      return serverError('Failed to fetch inspection', inspectionError);
    }

    // Fetch answers
    const { data: answers, error: answersError } = await supabase
      .from('inspection_answers')
      .select('*')
      .eq('inspection_id', inspectionId)
      .eq('tenant_id', tenant.id)
      .order('created_at');

    if (answersError) {
      return serverError('Failed to fetch answers', answersError);
    }

    // Fetch findings
    const { data: findings, error: findingsError } = await supabase
      .from('inspection_findings')
      .select('*')
      .eq('inspection_id', inspectionId)
      .eq('tenant_id', tenant.id)
      .order('created_at');

    if (findingsError) {
      return serverError('Failed to fetch findings', findingsError);
    }

    // Fetch signatures
    const { data: signatures, error: signaturesError } = await supabase
      .from('inspection_signatures')
      .select('*')
      .eq('inspection_id', inspectionId)
      .eq('tenant_id', tenant.id)
      .order('signed_at');

    if (signaturesError) {
      return serverError('Failed to fetch signatures', signaturesError);
    }

    // Fetch media assets
    const { data: media, error: mediaError } = await supabase
      .from('inspection_media')
      .select('*')
      .eq('inspection_id', inspectionId)
      .eq('tenant_id', tenant.id)
      .order('created_at');

    if (mediaError) {
      return serverError('Failed to fetch media', mediaError);
    }

    return success({
      inspection,
      answers: answers || [],
      findings: findings || [],
      signatures: signatures || [],
      media: media || [],
    });
  } catch (error) {
    console.error('Error fetching inspection data:', error);
    return serverError('Internal server error', error);
  }
}
