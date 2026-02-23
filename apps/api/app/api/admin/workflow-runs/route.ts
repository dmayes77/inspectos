import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

/**
 * GET /api/admin/workflow-runs
 */
export const GET = withAuth(async ({ supabase, tenant }) => {
  const { data, error } = await supabase
    .from('workflow_runs')
    .select('*, workflow:workflows(id, name), trigger_entity:trigger_entity_type')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  if (error) return serverError('Failed to fetch workflow runs', error);

  return success(data || []);
});
