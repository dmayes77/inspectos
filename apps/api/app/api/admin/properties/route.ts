import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
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
    if (!tenantSlug) {
      return badRequest('Missing tenant parameter');
    }

    const clientId = request.nextUrl.searchParams.get('client_id');

    const supabase = createUserClient(accessToken);

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

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
    const {
      tenant_slug,
      client_id,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      property_type,
      year_built,
      square_feet,
      notes
    } = body;

    if (!tenant_slug || !address_line1 || !city || !state || !zip_code) {
      return badRequest('Missing required fields: tenant_slug, address_line1, city, state, zip_code');
    }

    const supabase = createUserClient(accessToken);

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenant_slug)
      .single();

    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Create property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert({
        tenant_id: tenant.id,
        client_id: client_id || null,
        address_line1,
        address_line2: address_line2 || null,
        city,
        state,
        zip_code,
        property_type: property_type || 'residential',
        year_built: year_built || null,
        square_feet: square_feet || null,
        notes: notes || null
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
