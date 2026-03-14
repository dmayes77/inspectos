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

type FieldIntakePatchRequest = {
  contact_name?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
};

function parsePatchBody(value: unknown): FieldIntakePatchRequest | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<FieldIntakePatchRequest>;

  const contact_name = typeof raw.contact_name === 'string' ? raw.contact_name.trim() : undefined;
  const address_line1 = typeof raw.address_line1 === 'string' ? raw.address_line1.trim() : undefined;
  const city = typeof raw.city === 'string' ? raw.city.trim() : undefined;
  const state = typeof raw.state === 'string' ? raw.state.trim().toUpperCase() : undefined;
  const zip_code = typeof raw.zip_code === 'string' ? raw.zip_code.trim() : undefined;

  if (
    typeof contact_name === 'undefined' &&
    typeof address_line1 === 'undefined' &&
    typeof city === 'undefined' &&
    typeof state === 'undefined' &&
    typeof zip_code === 'undefined'
  ) {
    return null;
  }

  return { contact_name, address_line1, city, state, zip_code };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const body = parsePatchBody(await request.json().catch(() => null));
    if (!body) {
      return applyCorsHeaders(badRequest('Invalid field intake update payload'), request);
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

    const order = await resolveOrderForTenantLookup<{
      id: string;
      status: string;
      source?: string | null;
      inspector_id?: string | null;
      client_id?: string | null;
      property_id?: string | null;
    }>(
      supabase,
      tenant.id,
      lookup,
      'id, status, source, inspector_id, client_id, property_id',
      scopedInspectorIds
    );
    if (!order) {
      return applyCorsHeaders(badRequest('Order not found'), request);
    }

    const isFieldIntakeOrder =
      typeof order.source === 'string' &&
      order.source.startsWith('mobile_field_intake:');

    if (!isFieldIntakeOrder) {
      return applyCorsHeaders(badRequest('Order is not a Field Intake'), request);
    }

    if (order.status !== 'pending') {
      return applyCorsHeaders(
        badRequest('Field Intake can only be edited before dispatch deploy.'),
        request
      );
    }

    if (typeof body.contact_name === 'string') {
      if (!order.client_id) {
        return applyCorsHeaders(badRequest('Order has no client to update'), request);
      }

      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update({ name: body.contact_name })
        .eq('id', order.client_id)
        .eq('tenant_id', tenant.id);

      if (clientUpdateError) {
        return applyCorsHeaders(serverError('Failed to update Field Intake contact', clientUpdateError), request);
      }
    }

    const wantsAddressUpdate =
      typeof body.address_line1 === 'string' ||
      typeof body.city === 'string' ||
      typeof body.state === 'string' ||
      typeof body.zip_code === 'string';

    if (wantsAddressUpdate) {
      if (!order.property_id) {
        return applyCorsHeaders(badRequest('Order has no property to update'), request);
      }

      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id, address_line1, city, state, zip_code, property_type')
        .eq('id', order.property_id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (propertyError || !property) {
        return applyCorsHeaders(serverError('Failed to load Field Intake property', propertyError), request);
      }

      const nextAddressLine1 = body.address_line1 ?? property.address_line1;
      const nextCity = body.city ?? property.city;
      const nextState = body.state ?? property.state;
      const nextZipCode = body.zip_code ?? property.zip_code;

      if (!nextAddressLine1 || !nextCity || !nextState || !nextZipCode) {
        return applyCorsHeaders(badRequest('Address fields cannot be empty'), request);
      }

      const { data: linkedOrders, error: linkedOrdersError } = await supabase
        .from('orders')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('property_id', property.id);

      if (linkedOrdersError) {
        return applyCorsHeaders(serverError('Failed to validate property linkage', linkedOrdersError), request);
      }

      const propertyUsedByMultipleOrders = (linkedOrders?.length ?? 0) > 1;
      if (propertyUsedByMultipleOrders) {
        const { data: insertedProperty, error: propertyInsertError } = await supabase
          .from('properties')
          .insert({
            tenant_id: tenant.id,
            address_line1: nextAddressLine1,
            city: nextCity,
            state: nextState,
            zip_code: nextZipCode,
            property_type: property.property_type ?? 'single-family',
          })
          .select('id')
          .single();

        if (propertyInsertError || !insertedProperty) {
          return applyCorsHeaders(serverError('Failed to create updated Field Intake property', propertyInsertError), request);
        }

        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({ property_id: insertedProperty.id })
          .eq('id', order.id)
          .eq('tenant_id', tenant.id);

        if (orderUpdateError) {
          return applyCorsHeaders(serverError('Failed to link updated Field Intake property', orderUpdateError), request);
        }
      } else {
        const { error: propertyUpdateError } = await supabase
          .from('properties')
          .update({
            address_line1: nextAddressLine1,
            city: nextCity,
            state: nextState,
            zip_code: nextZipCode,
          })
          .eq('id', property.id)
          .eq('tenant_id', tenant.id);

        if (propertyUpdateError) {
          return applyCorsHeaders(serverError('Failed to update Field Intake property', propertyUpdateError), request);
        }
      }
    }

    return applyCorsHeaders(
      Response.json({
        success: true,
        data: {
          order_id: order.id,
          updated: true,
        },
      }),
      request
    );
  } catch (error) {
    console.error('[Mobile Field Intake PATCH] Error:', error);
    return applyCorsHeaders(serverError('Failed to update Field Intake'), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'PATCH, OPTIONS');
}
