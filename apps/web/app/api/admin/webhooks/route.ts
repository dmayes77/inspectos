import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createWebhookSchema } from "@/lib/validations/webhook";
import { randomBytes } from "crypto";

/**
 * GET /api/admin/webhooks
 * List all webhooks for the current tenant
 */
export async function GET() {
  const tenantId = getTenantId();

  const { data: webhooks, error } = await supabaseAdmin
    .from("webhooks")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: webhooks ?? [] });
}

/**
 * POST /api/admin/webhooks
 * Create a new webhook
 */
export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createWebhookSchema);
  if (validation.error) {
    return validation.error;
  }

  const payload = validation.data;

  // Generate secret if not provided
  const secret = payload.secret || randomBytes(32).toString("hex");

  const { data: webhook, error } = await supabaseAdmin
    .from("webhooks")
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      url: payload.url,
      description: payload.description ?? null,
      events: payload.events,
      secret,
      headers: payload.headers ?? {},
      retry_strategy: payload.retry_strategy ?? {
        max_attempts: 3,
        backoff: "exponential",
        timeout: 30000,
      },
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: webhook }, { status: 201 });
}
