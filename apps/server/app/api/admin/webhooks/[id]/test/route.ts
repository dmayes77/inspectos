import { badRequest, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';

/**
 * POST /api/admin/webhooks/[id]/test
 */
export const POST = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id: webhookId } = params;

  const body = await request.json();
  const { event } = body;

  if (!event) {
    return badRequest('event is required');
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
});
