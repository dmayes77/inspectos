import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  notFound,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderWithJoins {
  id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  status: string;
  properties?: { id: string; address_line1: string; address_line2: string | null; city: string; state: string; zip_code: string } | null;
  clients?: { id: string; name: string; email: string | null; phone: string | null; company: string | null } | null;
  profiles?: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null;
}

/**
 * GET /api/admin/inspections/[id]
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

    const { data: inspection, error } = await supabase
      .from('inspections')
      .select(`
        *,
        order:order_id(
          id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          status,
          properties!property_id(
            id,
            address_line1,
            address_line2,
            city,
            state,
            zip_code
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
        )
      `)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Inspection not found');
      }
      return serverError('Failed to fetch inspection', error);
    }

    // Transform the inspection data to match UI expectations
    const orderWithJoins = inspection.order as OrderWithJoins | null;
    const transformedInspection = {
      ...inspection,
      // Rename order.clients/properties/profiles to singular for UI compatibility
      order: orderWithJoins ? {
        ...orderWithJoins,
        property: orderWithJoins.properties || null,
        client: orderWithJoins.clients || null,
        inspector: orderWithJoins.profiles || null,
      } : null,
      // Add inspector at top level for backward compatibility
      inspector: orderWithJoins ? orderWithJoins.profiles : null,
    };

    return success(transformedInspection);
  } catch (error) {
    return serverError('Failed to fetch inspection', error);
  }
}

/**
 * PUT /api/admin/inspections/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const {
      status,
      started_at,
      completed_at,
      weather_conditions,
      temperature,
      present_parties,
      notes
    } = body;

    const tenantSlug = body.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (started_at !== undefined) updateData.started_at = started_at || null;
    if (completed_at !== undefined) updateData.completed_at = completed_at || null;
    if (weather_conditions !== undefined) updateData.weather_conditions = weather_conditions || null;
    if (temperature !== undefined) updateData.temperature = temperature || null;
    if (present_parties !== undefined) updateData.present_parties = present_parties || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const { data: inspection, error } = await supabase
      .from('inspections')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Inspection not found');
      }
      return serverError('Failed to update inspection', error);
    }

    if (!inspection) {
      return notFound('Inspection not found');
    }

    return success(inspection);
  } catch (error) {
    return serverError('Failed to update inspection', error);
  }
}

/**
 * DELETE /api/admin/inspections/[id]
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
      .from('inspections')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) {
      return serverError('Failed to delete inspection', error);
    }

    return success(true);
  } catch (error) {
    return serverError('Failed to delete inspection', error);
  }
}
