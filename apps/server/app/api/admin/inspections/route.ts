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
import { resolveTenant } from '@/lib/tenants';

/**
 * GET /api/admin/inspections
 *
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
 * - status: filter by status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[INSPECTIONS GET] Request received - NEW CODE VERSION 2025-02-07');
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const status = request.nextUrl.searchParams.get('status');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Simplified query without joins to test
    let query = supabase
      .from('inspections')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: inspections, error } = await query;
    if (error) {
      return serverError('Failed to fetch inspections', error);
    }

    return success(inspections || []);
  } catch (error) {
    return serverError('Failed to fetch inspections', error);
  }
}

/**
 * POST /api/admin/inspections
 */
export async function POST(request: NextRequest) {
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
      tenant_slug,
      order_id,
      order_schedule_id,
      template_id,
      template_version,
      status,
      started_at,
      completed_at,
      weather_conditions,
      temperature,
      present_parties,
      notes,
      selected_type_ids
    } = body;

    if (!order_id || !template_id) {
      return badRequest('Missing required fields: order_id, template_id');
    }

    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenant_slug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data: inspection, error } = await supabase
      .from('inspections')
      .insert({
        tenant_id: tenant.id,
        order_id,
        order_schedule_id: order_schedule_id || null,
        template_id,
        template_version: template_version || 1,
        status: status || 'draft',
        started_at: started_at || null,
        completed_at: completed_at || null,
        weather_conditions: weather_conditions || null,
        temperature: temperature || null,
        present_parties: present_parties || null,
        notes: notes || null,
        selected_type_ids: selected_type_ids || []
      })
      .select('*')
      .single();

    if (error || !inspection) {
      return serverError('Failed to create inspection', error);
    }

    return success(inspection);
  } catch (error) {
    return serverError('Failed to create inspection', error);
  }
}
