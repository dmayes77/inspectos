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
import { createLogger, generateRequestId } from '@/lib/logger';
import { rateLimitByIP, RateLimitPresets } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/jobs/[id]
 *
 * Fetches a single job by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'jobs-get' });

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

    const supabase = createUserClient(accessToken);

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        property:properties(*),
        client:clients(id, name, email, phone, company),
        template:templates(id, name, description),
        inspector:profiles(id, full_name, email, avatar_url),
        inspections(
          id, status, started_at, completed_at,
          answers(count),
          findings(count),
          signatures(count)
        )
      `)
      .eq('id', id)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') {
        return notFound('Job not found');
      }
      log.error('Failed to fetch job', { jobId: id }, jobError);
      return serverError('Failed to fetch job', jobError, { requestId });
    }

    return success(job);
  } catch (error) {
    log.error('Job fetch failed', { requestId, jobId: id }, error);
    return serverError('Failed to fetch job', error, { requestId });
  }
}

/**
 * PUT /api/admin/jobs/[id]
 *
 * Updates a job
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'jobs-update' });

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
      property_id,
      client_id,
      template_id,
      inspector_id,
      status,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      selected_service_ids,
      notes
    } = body;

    const supabase = createUserClient(accessToken);

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (property_id !== undefined) updateData.property_id = property_id;
    if (client_id !== undefined) updateData.client_id = client_id;
    if (template_id !== undefined) updateData.template_id = template_id;
    if (inspector_id !== undefined) updateData.inspector_id = inspector_id;
    if (status !== undefined) updateData.status = status;
    if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (selected_service_ids !== undefined) updateData.selected_service_ids = selected_service_ids;
    if (notes !== undefined) updateData.notes = notes;

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        property:properties(*),
        client:clients(id, name, email, phone),
        template:templates(id, name),
        inspector:profiles(id, full_name, email)
      `)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') {
        return notFound('Job not found');
      }
      log.error('Failed to update job', { jobId: id }, jobError);
      return serverError('Failed to update job', jobError, { requestId });
    }

    log.info('Job updated', { jobId: id });

    return success(job);
  } catch (error) {
    log.error('Job update failed', { requestId, jobId: id }, error);
    return serverError('Failed to update job', error, { requestId });
  }
}

/**
 * DELETE /api/admin/jobs/[id]
 *
 * Deletes a job (only if no inspections exist)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'jobs-delete' });

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

    const supabase = createUserClient(accessToken);

    // Check for existing inspections
    const { data: inspections } = await supabase
      .from('inspections')
      .select('id')
      .eq('job_id', id)
      .limit(1);

    if (inspections && inspections.length > 0) {
      return badRequest('Cannot delete job with existing inspections. Cancel the job instead.');
    }

    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      log.error('Failed to delete job', { jobId: id }, deleteError);
      return serverError('Failed to delete job', deleteError, { requestId });
    }

    log.info('Job deleted', { jobId: id });

    return success({ deleted: true });
  } catch (error) {
    log.error('Job deletion failed', { requestId, jobId: id }, error);
    return serverError('Failed to delete job', error, { requestId });
  }
}
