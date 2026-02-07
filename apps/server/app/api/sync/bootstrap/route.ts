import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError
} from '@/lib/supabase';

/**
 * GET /api/sync/bootstrap
 *
 * Downloads all data needed to work offline:
 * - User profile
 * - Templates (with sections and items)
 * - Jobs (for the next 14 days)
 * - Properties (for those jobs)
 * - Clients (for those jobs)
 * - Defect library
 * - Services
 *
 * Query params:
 * - tenant: tenant slug (required)
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
    if (!tenantSlug) {
      return badRequest('Missing tenant parameter');
    }

    const supabase = createUserClient(accessToken);

    // Get tenant and verify membership
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Verify user is a member of this tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select('id, role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.userId)
      .single();

    if (membershipError || !membership) {
      return unauthorized('Not a member of this tenant');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .eq('id', user.userId)
      .single();

    // Calculate date range for jobs (today + 14 days)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);

    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get templates with sections and items
    const { data: templates } = await supabase
      .from('templates')
      .select(`
        id, tenant_id, name, description, version, is_active, created_at, updated_at,
        template_sections (
          id, template_id, name, description, sort_order, created_at, updated_at,
          template_items (
            id, section_id, name, description, item_type, options, is_required, sort_order, created_at, updated_at
          )
        )
      `)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name');

    // Get jobs for this inspector in the date range
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('inspector_id', user.userId)
      .gte('scheduled_date', startDateStr)
      .lte('scheduled_date', endDateStr)
      .order('scheduled_date')
      .order('scheduled_time');

    // Get unique property IDs and client IDs from jobs
    const propertyIds = [...new Set((jobs || []).map(j => j.property_id).filter(Boolean))];
    const clientIds = [...new Set((jobs || []).map(j => j.client_id).filter(Boolean))];

    // Get properties for these jobs
    const { data: properties } = propertyIds.length > 0
      ? await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds)
      : { data: [] };

    // Get clients for these jobs
    const { data: clients } = clientIds.length > 0
      ? await supabase
          .from('clients')
          .select('*')
          .in('id', clientIds)
      : { data: [] };

    // Get defect library for this tenant
    const { data: defectLibrary } = await supabase
      .from('defect_library')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('category')
      .order('name');

    // Get active services for this tenant
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('category')
      .order('name');

    // Get any existing inspections for these jobs (in case of resume)
    const jobIds = (jobs || []).map(j => j.id);
    const { data: inspections } = jobIds.length > 0
      ? await supabase
          .from('inspections')
          .select(`
            *,
            answers (*),
            findings (*),
            signatures (*)
          `)
          .in('job_id', jobIds)
      : { data: [] };

    return Response.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        },
        user: {
          id: user.userId,
          email: profile?.email || user.email,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          role: membership.role
        },
        templates: templates || [],
        jobs: jobs || [],
        properties: properties || [],
        clients: clients || [],
        defect_library: defectLibrary || [],
        services: services || [],
        inspections: inspections || []
      },
      synced_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Sync Bootstrap] Error:', error);
    return serverError();
  }
}
