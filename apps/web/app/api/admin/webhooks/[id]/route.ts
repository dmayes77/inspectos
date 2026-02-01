import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateWebhookSchema } from "@/lib/validations/webhook";

/**
 * GET /api/admin/webhooks/[id]
 * Get webhook details with recent deliveries
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: webhook, error } = await supabaseAdmin
    .from("webhooks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !webhook) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Webhook not found" } },
      { status: 404 }
    );
  }

  // Fetch recent deliveries
  const { data: deliveries } = await supabaseAdmin
    .from("webhook_deliveries")
    .select("*")
    .eq("webhook_id", id)
    .order("delivered_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    data: {
      ...webhook,
      recent_deliveries: deliveries ?? [],
    },
  });
}

/**
 * PUT /api/admin/webhooks/[id]
 * Update webhook configuration
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, updateWebhookSchema);
  if (validation.error) {
    return validation.error;
  }

  const payload = validation.data;

  // Build update object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.url !== undefined) updateData.url = payload.url;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.events !== undefined) updateData.events = payload.events;
  if (payload.secret !== undefined) updateData.secret = payload.secret;
  if (payload.headers !== undefined) updateData.headers = payload.headers;
  if (payload.status !== undefined) {
    updateData.status = payload.status;
    // Reset failure count if manually activated
    if (payload.status === "active") {
      updateData.failure_count = 0;
      updateData.last_error = null;
    }
  }
  if (payload.retry_strategy !== undefined) {
    updateData.retry_strategy = payload.retry_strategy;
  }

  const { data: webhook, error } = await supabaseAdmin
    .from("webhooks")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: webhook });
}

/**
 * DELETE /api/admin/webhooks/[id]
 * Delete webhook
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("webhooks")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
