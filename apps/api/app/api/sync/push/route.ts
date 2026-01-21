import { NextRequest } from 'next/server';
import {
  createServiceClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { createLogger, generateRequestId } from '@/lib/logger';
import { rateLimitByIP, RateLimitPresets } from '@/lib/rate-limit';

interface OutboxItem {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  created_at: string;
}

interface PushRequest {
  tenant_id: string;
  items: OutboxItem[];
}

interface PushResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * POST /api/sync/push
 *
 * Receives batched offline changes from the mobile app.
 * Each item is processed idempotently (safe to retry).
 *
 * Body:
 * {
 *   tenant_id: string,
 *   items: OutboxItem[]
 * }
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const log = createLogger({ requestId, operation: 'sync-push' });

  // Rate limiting
  const rateLimitResponse = rateLimitByIP(request, RateLimitPresets.sync);
  if (rateLimitResponse) {
    log.warn('Rate limit exceeded');
    return rateLimitResponse;
  }

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      log.warn('Missing access token');
      return unauthorized('Missing access token', { requestId });
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      log.warn('Invalid access token');
      return unauthorized('Invalid access token', { requestId });
    }

    log.info('Processing sync push', { userId: user.userId });

    const body: PushRequest = await request.json();
    if (!body.tenant_id || !body.items || !Array.isArray(body.items)) {
      return badRequest('Invalid request body');
    }

    // Use service client to bypass RLS for batch operations
    // But we still verify tenant membership first
    const supabase = createServiceClient();

    // Verify user is a member of this tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select('id, role')
      .eq('tenant_id', body.tenant_id)
      .eq('user_id', user.userId)
      .single();

    if (membershipError || !membership) {
      return unauthorized('Not a member of this tenant');
    }

    const results: PushResult[] = [];

    for (const item of body.items) {
      try {
        const result = await processItem(supabase, body.tenant_id, user.userId, item);
        results.push(result);
      } catch (error) {
        results.push({
          id: item.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    log.info('Sync push completed', {
      tenantId: body.tenant_id,
      userId: user.userId,
      processed: results.length,
      succeeded: successCount,
      failed: failCount,
    });

    return success({
      processed: results.length,
      succeeded: successCount,
      failed: failCount,
      results,
      synced_at: new Date().toISOString()
    });
  } catch (error) {
    log.error('Sync push failed', { requestId }, error);
    return serverError('Sync push failed', error, { requestId });
  }
}

async function processItem(
  supabase: ReturnType<typeof createServiceClient>,
  tenantId: string,
  userId: string,
  item: OutboxItem
): Promise<PushResult> {
  const { entity_type, entity_id, operation, payload } = item;

  // Verify the entity belongs to this tenant (for upserts)
  if (operation === 'upsert' && payload.tenant_id && payload.tenant_id !== tenantId) {
    return { id: item.id, success: false, error: 'Tenant mismatch' };
  }

  switch (entity_type) {
    case 'inspection':
      return await processInspection(supabase, tenantId, operation, entity_id, payload);

    case 'answer':
      return await processAnswer(supabase, operation, entity_id, payload);

    case 'finding':
      return await processFinding(supabase, operation, entity_id, payload);

    case 'signature':
      return await processSignature(supabase, operation, entity_id, payload);

    case 'job_status':
      return await processJobStatus(supabase, tenantId, entity_id, payload);

    default:
      return { id: item.id, success: false, error: `Unknown entity type: ${entity_type}` };
  }
}

async function processInspection(
  supabase: ReturnType<typeof createServiceClient>,
  tenantId: string,
  operation: 'upsert' | 'delete',
  entityId: string,
  payload: Record<string, unknown>
): Promise<PushResult> {
  if (operation === 'delete') {
    const { error } = await supabase.from('inspections').delete().eq('id', entityId);
    if (error) return { id: entityId, success: false, error: error.message };
    return { id: entityId, success: true };
  }

  // Upsert inspection
  const { error } = await supabase.from('inspections').upsert({
    id: payload.id as string,
    job_id: payload.job_id as string,
    tenant_id: tenantId,
    template_id: payload.template_id as string,
    template_version: payload.template_version as number,
    inspector_id: payload.inspector_id as string,
    status: payload.status as string,
    started_at: payload.started_at as string | null,
    completed_at: payload.completed_at as string | null,
    weather_conditions: payload.weather_conditions as string | null,
    temperature: payload.temperature as string | null,
    present_parties: payload.present_parties as string | null,
    notes: payload.notes as string | null,
    created_at: payload.created_at as string,
    updated_at: payload.updated_at as string
  }, { onConflict: 'id' });

  if (error) return { id: entityId, success: false, error: error.message };
  return { id: entityId, success: true };
}

async function processAnswer(
  supabase: ReturnType<typeof createServiceClient>,
  operation: 'upsert' | 'delete',
  entityId: string,
  payload: Record<string, unknown>
): Promise<PushResult> {
  if (operation === 'delete') {
    const { error } = await supabase.from('answers').delete().eq('id', entityId);
    if (error) return { id: entityId, success: false, error: error.message };
    return { id: entityId, success: true };
  }

  const { error } = await supabase.from('answers').upsert({
    id: payload.id as string,
    inspection_id: payload.inspection_id as string,
    template_item_id: payload.template_item_id as string,
    section_id: payload.section_id as string,
    value: payload.value as string | null,
    notes: payload.notes as string | null,
    created_at: payload.created_at as string || new Date().toISOString(),
    updated_at: payload.updated_at as string
  }, { onConflict: 'id' });

  if (error) return { id: entityId, success: false, error: error.message };
  return { id: entityId, success: true };
}

async function processFinding(
  supabase: ReturnType<typeof createServiceClient>,
  operation: 'upsert' | 'delete',
  entityId: string,
  payload: Record<string, unknown>
): Promise<PushResult> {
  if (operation === 'delete') {
    const { error } = await supabase.from('findings').delete().eq('id', entityId);
    if (error) return { id: entityId, success: false, error: error.message };
    return { id: entityId, success: true };
  }

  const { error } = await supabase.from('findings').upsert({
    id: payload.id as string,
    inspection_id: payload.inspection_id as string,
    section_id: payload.section_id as string | null,
    template_item_id: payload.template_item_id as string | null,
    defect_library_id: payload.defect_library_id as string | null,
    title: payload.title as string,
    description: payload.description as string | null,
    severity: payload.severity as string,
    location: payload.location as string | null,
    recommendation: payload.recommendation as string | null,
    estimated_cost_min: payload.estimated_cost_min as number | null,
    estimated_cost_max: payload.estimated_cost_max as number | null,
    created_at: payload.created_at as string || new Date().toISOString(),
    updated_at: payload.updated_at as string
  }, { onConflict: 'id' });

  if (error) return { id: entityId, success: false, error: error.message };
  return { id: entityId, success: true };
}

async function processSignature(
  supabase: ReturnType<typeof createServiceClient>,
  operation: 'upsert' | 'delete',
  entityId: string,
  payload: Record<string, unknown>
): Promise<PushResult> {
  if (operation === 'delete') {
    const { error } = await supabase.from('signatures').delete().eq('id', entityId);
    if (error) return { id: entityId, success: false, error: error.message };
    return { id: entityId, success: true };
  }

  const { error } = await supabase.from('signatures').upsert({
    id: payload.id as string,
    inspection_id: payload.inspection_id as string,
    signer_name: payload.signer_name as string,
    signer_type: payload.signer_type as string,
    signature_data: payload.signature_data as string,
    signed_at: payload.signed_at as string
  }, { onConflict: 'id' });

  if (error) return { id: entityId, success: false, error: error.message };
  return { id: entityId, success: true };
}

async function processJobStatus(
  supabase: ReturnType<typeof createServiceClient>,
  tenantId: string,
  entityId: string,
  payload: Record<string, unknown>
): Promise<PushResult> {
  // Verify job belongs to tenant
  const { data: job } = await supabase
    .from('jobs')
    .select('tenant_id')
    .eq('id', entityId)
    .single();

  if (!job || job.tenant_id !== tenantId) {
    return { id: entityId, success: false, error: 'Job not found or tenant mismatch' };
  }

  const { error } = await supabase
    .from('jobs')
    .update({
      status: payload.status as string,
      updated_at: new Date().toISOString()
    })
    .eq('id', entityId);

  if (error) return { id: entityId, success: false, error: error.message };
  return { id: entityId, success: true };
}
