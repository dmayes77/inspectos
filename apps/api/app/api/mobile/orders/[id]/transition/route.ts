import type { NextRequest } from 'next/server';
import {
  parseTransitionRequestBody,
  validateInspectionTransitionRequest,
} from '@inspectos/domains/orders';
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

    const { id } = await context.params;
    const lookup = resolveIdLookup(id, {
      publicColumn: 'order_number',
      transformPublicValue: (value) => value.toUpperCase(),
    });

    const rawBody = await request.json().catch(() => null);
    const body = parseTransitionRequestBody(rawBody);
    if (!body) {
      return applyCorsHeaders(badRequest('Invalid transition payload'), request);
    }

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

    const order = await resolveOrderForTenantLookup<{ id: string; status: string; inspector_id?: string | null; source?: string | null }>(
      supabase,
      tenant.id,
      lookup,
      'id, status, inspector_id, source',
      scopedInspectorIds
    );
    if (!order) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    const isLockedFieldIntake =
      typeof order.source === 'string' &&
      order.source.startsWith('mobile_field_intake:') &&
      order.status === 'pending';

    if (isLockedFieldIntake) {
      return applyCorsHeaders(
        Response.json(
          {
            success: false,
            error: {
              code: 'FIELD_INTAKE_PENDING_DISPATCH',
              message: 'Field Intake must be deployed by dispatch before inspection can continue.',
            },
          },
          { status: 409 }
        ),
        request
      );
    }

    const transition = validateInspectionTransitionRequest(body, order.id);
    if (!transition.ok) {
      if (transition.failure.code === 'TRANSITION_NOT_ALLOWED') {
        return applyCorsHeaders(
          badRequest(transition.failure.message),
          request
        );
      }

      if (transition.failure.code === 'TRANSITION_CHECKS_FAILED') {
        return applyCorsHeaders(
          Response.json(
            {
              success: false,
              error: {
                code: transition.failure.code,
                message: transition.failure.message,
                missing_checks: transition.failure.missingChecks,
              },
            },
            { status: 409 }
          ),
          request
        );
      }

      return applyCorsHeaders(
        badRequest(transition.failure.message),
        request
      );
    }

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: transition.result,
      }),
      request
    );
  } catch (error) {
    console.error('[Mobile Order Transition] Error:', error);
    return applyCorsHeaders(serverError('Failed to process order transition'), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'POST, OPTIONS');
}
