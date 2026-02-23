import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

/**
 * GET /api/admin/pay-rules
 */
export const GET = withAuth(async ({ supabase, tenant }) => {
  const { data, error } = await supabase
    .from('pay_rules')
    .select(`
      id,
      name,
      description,
      rule_type,
      percentage,
      flat_amount,
      hourly_rate,
      applies_to,
      is_default,
      is_active,
      created_at,
      updated_at
    `)
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  if (error) {
    return serverError('Failed to fetch pay rules', error);
  }

  return success(data || []);
});
