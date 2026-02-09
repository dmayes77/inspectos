import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success,
  validationError
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';
import { createPropertySchema } from '@inspectos/shared/validations/property';
import { createLogger, generateRequestId } from '@/lib/logger';
import { rateLimitByIP, RateLimitPresets } from '@/lib/rate-limit';

/**
 * GET /api/admin/properties
 *
 * Fetches properties for the tenant
 * Query params:
 * - tenant: tenant slug (required)
 * - client_id: filter by client (optional)
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'properties-list' });

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

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const clientId = request.nextUrl.searchParams.get('client_id');

    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Build query
    let query = supabase
      .from('properties')
      .select(`
        *,
        client:clients(id, name, email, phone)
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: properties, error: propertiesError } = await query;

    if (propertiesError) {
      log.error('Failed to fetch properties', { tenantId: tenant.id }, propertiesError);
      return serverError('Failed to fetch properties', propertiesError, { requestId });
    }

    return success(properties || []);
  } catch (error) {
    log.error('Properties list failed', { requestId }, error);
    return serverError('Failed to list properties', error, { requestId });
  }
}

/**
 * POST /api/admin/properties
 *
 * Creates a new property
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'properties-create' });

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

    const body = await request.json();

    // Validate request body
    const validation = createPropertySchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.issues[0]?.message || 'Validation failed');
    }
    const payload = validation.data;

    const tenantSlug = body.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Create property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert({
        tenant_id: tenant.id,
        client_id: payload.client_id ?? null,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2 ?? null,
        city: payload.city,
        state: payload.state,
        zip_code: payload.zip_code,
        property_type: payload.property_type ?? 'single-family',
        year_built: payload.year_built ?? null,
        square_feet: payload.square_feet ?? null,
        notes: payload.notes ?? null,
        bedrooms: payload.bedrooms ?? null,
        bathrooms: payload.bathrooms ?? null,
        stories: payload.stories ?? null,
        foundation: payload.foundation ?? null,
        garage: payload.garage ?? null,
        pool: payload.pool ?? null,
        basement: payload.basement ?? null,
        lot_size_acres: payload.lot_size_acres ?? null,
        heating_type: payload.heating_type ?? null,
        cooling_type: payload.cooling_type ?? null,
        roof_type: payload.roof_type ?? null,
        building_class: payload.building_class ?? null,
        loading_docks: payload.loading_docks ?? null,
        zoning: payload.zoning ?? null,
        occupancy_type: payload.occupancy_type ?? null,
        ceiling_height: payload.ceiling_height ?? null,
        number_of_units: payload.number_of_units ?? null,
        unit_mix: payload.unit_mix ?? null,
        laundry_type: payload.laundry_type ?? null,
        parking_spaces: payload.parking_spaces ?? null,
        elevator: payload.elevator ?? null,
      })
      .select(`
        *,
        client:clients(id, name, email, phone)
      `)
      .single();

    if (propertyError) {
      log.error('Failed to create property', { tenantId: tenant.id }, propertyError);
      return serverError('Failed to create property', propertyError, { requestId });
    }

    log.info('Property created', { tenantId: tenant.id, propertyId: property.id });

    return success(property);
  } catch (error) {
    log.error('Property creation failed', { requestId }, error);
    return serverError('Failed to create property', error, { requestId });
  }
}
