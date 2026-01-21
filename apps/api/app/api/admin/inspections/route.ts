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

    let query = supabase
      .from('inspections')
      .select(`
        id,
        job_id,
        tenant_id,
        template_id,
        template_version,
        inspector_id,
        status,
        started_at,
        completed_at,
        weather_conditions,
        temperature,
        present_parties,
        notes,
        created_at,
        updated_at,
        job:jobs(
          id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          status,
          selected_service_ids,
          property:properties(address_line1, address_line2, city, state, zip_code),
          client:clients(id, name, email, phone, company)
        ),
        inspector:profiles(id, full_name, email, avatar_url)
      `)
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
      job_id,
      template_id,
      template_version,
      inspector_id,
      status,
      started_at,
      completed_at,
      weather_conditions,
      temperature,
      present_parties,
      notes
    } = body;

    if (!job_id || !template_id || !inspector_id) {
      return badRequest('Missing required fields: job_id, template_id, inspector_id');
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
        job_id,
        template_id,
        template_version: template_version || 1,
        inspector_id,
        status: status || 'draft',
        started_at: started_at || null,
        completed_at: completed_at || null,
        weather_conditions: weather_conditions || null,
        temperature: temperature || null,
        present_parties: present_parties || null,
        notes: notes || null
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
