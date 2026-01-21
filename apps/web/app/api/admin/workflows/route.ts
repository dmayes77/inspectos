import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createWorkflowSchema } from "@/lib/validations/workflow";

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .select("id, name, description, trigger_scope, trigger_type, trigger_tag_id, conditions, actions, delay_minutes, is_active, is_system")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description ?? null,
      triggerScope: workflow.trigger_scope,
      triggerType: workflow.trigger_type,
      triggerTagId: workflow.trigger_tag_id ?? null,
      conditions: workflow.conditions ?? {},
      actions: workflow.actions ?? [],
      delayMinutes: workflow.delay_minutes ?? 0,
      isActive: workflow.is_active,
      isSystem: workflow.is_system,
    }))
  );
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createWorkflowSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("workflows")
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      description: payload.description ?? null,
      trigger_scope: payload.triggerScope,
      trigger_type: payload.triggerType,
      trigger_tag_id: payload.triggerTagId ?? null,
      conditions: payload.conditions ?? {},
      actions: payload.actions ?? [],
      delay_minutes: payload.delayMinutes ?? 0,
      is_active: payload.isActive ?? true,
      is_system: false,
    })
    .select("id, name, description, trigger_scope, trigger_type, trigger_tag_id, conditions, actions, delay_minutes, is_active, is_system")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create workflow." }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description ?? null,
    triggerScope: data.trigger_scope,
    triggerType: data.trigger_type,
    triggerTagId: data.trigger_tag_id ?? null,
    conditions: data.conditions ?? {},
    actions: data.actions ?? [],
    delayMinutes: data.delay_minutes ?? 0,
    isActive: data.is_active,
    isSystem: data.is_system,
  });
}
