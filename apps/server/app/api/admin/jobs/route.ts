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
 * GET /api/admin/jobs
 *
 * Fetches jobs for the tenant with optional filters
 * Query params:
 * - tenant: tenant slug (required)
 * - status: filter by status (optional)
 * - inspector_id: filter by inspector (optional)
 * - from: start date (optional)
 * - to: end date (optional)
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'jobs-list' });

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

    const status = request.nextUrl.searchParams.get('status');
    const inspectorId = request.nextUrl.searchParams.get('inspector_id');
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');

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
      .from('jobs')
      .select(`
        *,
        property:properties(*),
        client:clients(id, name, email, phone),
        template:templates(id, name),
        inspector:profiles(id, full_name, email)
      `)
      .eq('tenant_id', tenant.id)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }
    if (inspectorId) {
      query = query.eq('inspector_id', inspectorId);
    }
    if (from) {
      query = query.gte('scheduled_date', from);
    }
    if (to) {
      query = query.lte('scheduled_date', to);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      log.error('Failed to fetch jobs', { tenantId: tenant.id }, jobsError);
      return serverError('Failed to fetch jobs', jobsError, { requestId });
    }

    log.info('Jobs fetched', { tenantId: tenant.id, count: jobs?.length });

    return success(jobs || []);
  } catch (error) {
    log.error('Jobs list failed', { requestId }, error);
    return serverError('Failed to list jobs', error, { requestId });
  }
}

/**
 * POST /api/admin/jobs
 *
 * Creates a new job
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'jobs-create' });

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
      property_id,
      client_id,
      template_id,
      inspector_id,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      selected_service_ids,
      notes
    } = body;

    if (!tenant_slug || !property_id || !template_id || !inspector_id || !scheduled_date) {
      return badRequest('Missing required fields: tenant_slug, property_id, template_id, inspector_id, scheduled_date');
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

    // Verify user is admin/owner
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.userId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return unauthorized('Only admins can create jobs');
    }

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        tenant_id: tenant.id,
        property_id,
        client_id: client_id || null,
        template_id,
        inspector_id,
        scheduled_date,
        scheduled_time: scheduled_time || null,
        duration_minutes: duration_minutes || 120,
        selected_service_ids: selected_service_ids || [],
        notes: notes || null,
        status: 'scheduled'
      })
      .select(`
        *,
        property:properties(*),
        client:clients(id, name, email, phone),
        template:templates(id, name),
        inspector:profiles(id, full_name, email)
      `)
      .single();

    if (jobError) {
      log.error('Failed to create job', { tenantId: tenant.id }, jobError);
      return serverError('Failed to create job', jobError, { requestId });
    }

    log.info('Job created', { tenantId: tenant.id, jobId: job.id });

    return success(job);
  } catch (error) {
    log.error('Job creation failed', { requestId }, error);
    return serverError('Failed to create job', error, { requestId });
  }
}
