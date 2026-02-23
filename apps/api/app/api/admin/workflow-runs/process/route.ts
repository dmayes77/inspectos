import { badRequest, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

/**
 * POST /api/admin/workflow-runs/process
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const body = await request.json();
  const { workflow_id, trigger_entity_type, trigger_entity_id } = body;

  if (!workflow_id || !trigger_entity_type || !trigger_entity_id) {
    return badRequest('workflow_id, trigger_entity_type, and trigger_entity_id are required');
  }

  // Create workflow run
  const { data, error } = await supabase
    .from('workflow_runs')
    .insert({
      tenant_id: tenant.id,
      workflow_id,
      trigger_entity_type,
      trigger_entity_id,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return serverError('Failed to process workflow', error);

  return success(data);
});
