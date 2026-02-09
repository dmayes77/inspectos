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
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';

/**
 * POST /api/admin/webhooks/[id]/test
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: webhookId } = await params;

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
    const { event } = body;

    if (!event) {
      return badRequest('event is required');
    }

    const tenantSlug = body.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Verify webhook belongs to tenant
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('tenant_id', tenant.id)
      .single();

    if (webhookError || !webhook) {
      return badRequest('Webhook not found');
    }

    // Create test payload
    const testPayload = {
      event_type: event,
      timestamp: new Date().toISOString(),
      test: true,
      data: {
        message: 'This is a test webhook delivery',
      },
    };

    // Trigger webhook delivery
    try {
      await triggerWebhookEvent(event, tenant.id, testPayload);

      return success({
        message: 'Webhook test triggered successfully',
        event,
        webhook_id: webhookId,
      });
    } catch (deliveryError) {
      return serverError('Failed to deliver test webhook', deliveryError);
    }
  } catch (error) {
    return serverError('Failed to test webhook', error);
  }
}
