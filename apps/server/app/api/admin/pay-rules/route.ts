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
 * GET /api/admin/pay-rules
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
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to fetch pay rules', error);
  }
}
