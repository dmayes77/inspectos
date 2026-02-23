import { badRequest, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

/**
 * GET /api/admin/workflows
 */
export const GET = withAuth(async ({ supabase, tenant }) => {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('name');

  if (error) return serverError('Failed to fetch workflows', error);

  return success(data || []);
});

/**
 * POST /api/admin/workflows
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const body = await request.json();
  const { name, description, trigger_event, actions } = body;

  if (!name || !trigger_event) {
    return badRequest('name and trigger_event are required');
  }

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      tenant_id: tenant.id,
      name,
      description,
      trigger_event,
      actions: actions || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) return serverError('Failed to create workflow', error);

  return success(data);
});
