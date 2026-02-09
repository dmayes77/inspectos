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
import { updatePropertySchema } from '@inspectos/shared/validations/property';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/properties/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        client:clients(id, name, email, phone)
      `)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (error || !property) {
      return serverError('Property not found', error);
    }

    return success(property);
  } catch (error) {
    return serverError('Failed to fetch property', error);
  }
}

/**
 * PATCH /api/admin/properties/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const body = await request.json();

    // Validate request body
    const validation = updatePropertySchema.safeParse(body);
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

    // Build update data - only include fields that are present in payload
    const updateData: Record<string, unknown> = {};
    if (payload.client_id !== undefined) updateData.client_id = payload.client_id;
    if (payload.address_line1 !== undefined) updateData.address_line1 = payload.address_line1;
    if (payload.address_line2 !== undefined) updateData.address_line2 = payload.address_line2;
    if (payload.city !== undefined) updateData.city = payload.city;
    if (payload.state !== undefined) updateData.state = payload.state;
    if (payload.zip_code !== undefined) updateData.zip_code = payload.zip_code;
    if (payload.property_type !== undefined) updateData.property_type = payload.property_type;
    if (payload.year_built !== undefined) updateData.year_built = payload.year_built;
    if (payload.square_feet !== undefined) updateData.square_feet = payload.square_feet;
    if (payload.notes !== undefined) updateData.notes = payload.notes;
    if (payload.bedrooms !== undefined) updateData.bedrooms = payload.bedrooms;
    if (payload.bathrooms !== undefined) updateData.bathrooms = payload.bathrooms;
    if (payload.stories !== undefined) updateData.stories = payload.stories;
    if (payload.foundation !== undefined) updateData.foundation = payload.foundation;
    if (payload.garage !== undefined) updateData.garage = payload.garage;
    if (payload.pool !== undefined) updateData.pool = payload.pool;
    if (payload.basement !== undefined) updateData.basement = payload.basement;
    if (payload.lot_size_acres !== undefined) updateData.lot_size_acres = payload.lot_size_acres;
    if (payload.heating_type !== undefined) updateData.heating_type = payload.heating_type;
    if (payload.cooling_type !== undefined) updateData.cooling_type = payload.cooling_type;
    if (payload.roof_type !== undefined) updateData.roof_type = payload.roof_type;
    if (payload.building_class !== undefined) updateData.building_class = payload.building_class;
    if (payload.loading_docks !== undefined) updateData.loading_docks = payload.loading_docks;
    if (payload.zoning !== undefined) updateData.zoning = payload.zoning;
    if (payload.occupancy_type !== undefined) updateData.occupancy_type = payload.occupancy_type;
    if (payload.ceiling_height !== undefined) updateData.ceiling_height = payload.ceiling_height;
    if (payload.number_of_units !== undefined) updateData.number_of_units = payload.number_of_units;
    if (payload.unit_mix !== undefined) updateData.unit_mix = payload.unit_mix;
    if (payload.laundry_type !== undefined) updateData.laundry_type = payload.laundry_type;
    if (payload.parking_spaces !== undefined) updateData.parking_spaces = payload.parking_spaces;
    if (payload.elevator !== undefined) updateData.elevator = payload.elevator;

    const { data: property, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, email, phone)
      `)
      .single();

    if (error || !property) {
      return serverError('Failed to update property', error);
    }

    return success(property);
  } catch (error) {
    return serverError('Failed to update property', error);
  }
}

/**
 * DELETE /api/admin/properties/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) {
      return serverError('Failed to delete property', error);
    }

    return success({ deleted: true });
  } catch (error) {
    return serverError('Failed to delete property', error);
  }
}
