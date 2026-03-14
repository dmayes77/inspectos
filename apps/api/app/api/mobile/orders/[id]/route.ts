import type { NextRequest } from 'next/server';
import {
  buildInspectorScopeUserIds,
  hasInspectorSeatAccess,
  resolveInspectorMembership,
  resolveOrderForTenantLookup,
  resolveTenantForBusinessIdentifier,
} from '@inspectos/platform/mobile-orders-access';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';
import {
  badRequest,
  createUserClient,
  getAccessToken,
  getUserFromToken,
  serverError,
  unauthorized,
} from '@/lib/supabase';
import { resolveIdLookup } from '@/lib/identifiers/lookup';
import { fetchMobileInspectionOutline } from '@/lib/mobile-inspection-outline';

type TemplateSectionIdRow = {
  id: string;
};

type MobileOrderRow = {
  id: string;
  template_id?: string | null;
  [key: string]: unknown;
};

type CountQueryResult = {
  count: number | null;
  error: { message?: string | null } | null;
};

function isMissingRelationError(error: { message?: string | null } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? '';
  return (
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('column') ||
    message.includes('schema cache') ||
    message.includes('could not find')
  );
}

function resolveCountOrFallback(result: CountQueryResult, fallback = 0): { count: number; error: { message?: string | null } | null } {
  if (!result.error) {
    return { count: result.count ?? fallback, error: null };
  }

  if (isMissingRelationError(result.error)) {
    return { count: fallback, error: null };
  }

  return { count: fallback, error: result.error };
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

    const { id } = await context.params;
    const businessIdentifier = request.nextUrl.searchParams.get('business');
    if (!businessIdentifier) {
      return applyCorsHeaders(badRequest('Missing business parameter'), request);
    }
    const includeInspection = request.nextUrl.searchParams.get('include') === 'inspection';

    const lookup = resolveIdLookup(id, {
      publicColumn: 'order_number',
      transformPublicValue: (value) => value.toUpperCase(),
    });

    const supabase = createUserClient(accessToken);

    const tenant = await resolveTenantForBusinessIdentifier<{ id: string; name: string; slug: string; business_id?: string | null }>(
      supabase,
      businessIdentifier,
      'id, name, slug, business_id'
    );
    if (!tenant) {
      return applyCorsHeaders(badRequest('Business not found'), request);
    }

    const membership = await resolveInspectorMembership(supabase, tenant.id, user.userId);
    if (!membership) {
      return applyCorsHeaders(unauthorized('Not a member of this business'), request);
    }

    const hasInspectorAccess = hasInspectorSeatAccess(membership.role, membership.isInspectorFlag);

    if (!hasInspectorAccess) {
      return applyCorsHeaders(unauthorized('Inspector mobile access is restricted to inspector seats.'), request);
    }

    const inspectorIds = buildInspectorScopeUserIds(user.userId, membership.profileId);
    const scopedInspectorIds =
      membership.role === 'owner' || membership.role === 'admin' ? undefined : inspectorIds;

    const order = await resolveOrderForTenantLookup<MobileOrderRow>(
      supabase,
      tenant.id,
      lookup,
      `
        *,
        property:properties(id, address_line1, address_line2, city, state, zip_code, property_type),
        client:clients(id, name, email, phone),
        inspector:profiles(id, full_name, email, avatar_url)
      `,
      scopedInspectorIds
    );
    if (!order) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    if (!includeInspection) {
      const templateSectionIdsRes = order.template_id
        ? await supabase.from('template_sections').select('id').eq('template_id', order.template_id)
        : { data: [] as TemplateSectionIdRow[], error: null };

      if (templateSectionIdsRes.error && !isMissingRelationError(templateSectionIdsRes.error)) {
        return applyCorsHeaders(serverError('Failed to load template sections', templateSectionIdsRes.error), request);
      }

      const templateSectionIds = ((templateSectionIdsRes.error ? [] : templateSectionIdsRes.data ?? []) as TemplateSectionIdRow[])
        .map((row) => row.id)
        .filter((value): value is string => Boolean(value));

      const [answersCountRes, customAnswersCountRes, findingsCountRes, mediaCountRes, templateItemsCountRes] = await Promise.all([
        supabase.from('answers').select('*', { count: 'exact', head: true }).eq('order_id', order.id),
        supabase
          .from('mobile_inspection_custom_answers')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('order_id', order.id),
        supabase.from('findings').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('order_id', order.id),
        supabase.from('media_assets').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('order_id', order.id),
        templateSectionIds.length > 0
          ? supabase.from('template_items').select('*', { count: 'exact', head: true }).in('section_id', templateSectionIds)
          : Promise.resolve({ count: 0, error: null }),
      ]);

      const answersCount = resolveCountOrFallback(answersCountRes);
      const customAnswersCount = resolveCountOrFallback(customAnswersCountRes);
      const findingsCount = resolveCountOrFallback(findingsCountRes);
      const mediaCount = resolveCountOrFallback(mediaCountRes);
      const templateItemsCount = resolveCountOrFallback(templateItemsCountRes);

      if (answersCount.error) {
        return applyCorsHeaders(serverError('Failed to load answer counts', answersCount.error), request);
      }
      if (customAnswersCount.error) {
        return applyCorsHeaders(serverError('Failed to load custom answer counts', customAnswersCount.error), request);
      }
      if (mediaCount.error) {
        return applyCorsHeaders(serverError('Failed to load media count', mediaCount.error), request);
      }
      if (templateItemsCount.error) {
        return applyCorsHeaders(serverError('Failed to load template item count', templateItemsCount.error), request);
      }

      return applyCorsHeaders(
        Response.json({
          success: true,
          data: {
            order,
            template: null,
            answers: [],
            custom_answers: [],
            findings: [],
            signatures: [],
            media: [],
            progress_summary: {
              total_items: templateItemsCount.count,
              answered_count: answersCount.count,
              custom_answered_count: customAnswersCount.count,
              findings_count: findingsCount.count,
              media_count: mediaCount.count,
            },
          },
        }),
        request
      );
    }

    const [templateRowRes, customAnswersRes] = await Promise.all([
      order.template_id
        ? supabase
            .from('templates')
            .select('id, name, description')
            .eq('id', order.template_id)
            .eq('tenant_id', tenant.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('mobile_inspection_custom_answers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('order_id', order.id)
        .order('updated_at', { ascending: false }),
    ]);

    const template = await fetchMobileInspectionOutline(
      supabase,
      tenant.id,
      order.id,
      order.template_id,
      inspectorIds[0],
      templateRowRes.data?.name ?? null,
      templateRowRes.data?.description ?? null
    );

    const answersRes = await supabase.from('answers').select('*').eq('order_id', order.id).order('created_at');

    const [findingsRes, signaturesRes, mediaRes] = await Promise.all([
      supabase.from('findings').select('*').eq('order_id', order.id).eq('tenant_id', tenant.id).order('created_at'),
      supabase.from('signatures').select('*').eq('order_id', order.id).eq('tenant_id', tenant.id).order('signed_at'),
      supabase.from('media_assets').select('*').eq('order_id', order.id).eq('tenant_id', tenant.id).order('created_at'),
    ]);

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          order,
          template,
          answers: answersRes.data ?? [],
          custom_answers: customAnswersRes.data ?? [],
          findings: findingsRes.data ?? [],
          signatures: signaturesRes.data ?? [],
          media: mediaRes.data ?? [],
          progress_summary: {
            total_items: template?.sections?.reduce((count, section) => count + section.items.length, 0) ?? 0,
            answered_count: answersRes.data?.length ?? 0,
            custom_answered_count: customAnswersRes.data?.length ?? 0,
            findings_count: findingsRes.data?.length ?? 0,
            media_count: mediaRes.data?.length ?? 0,
          },
        },
      }),
      request
    );
  } catch (error) {
    console.error('[Mobile Order Detail] Error:', error);
    return applyCorsHeaders(serverError('Failed to load order detail'), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, OPTIONS');
}
