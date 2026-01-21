import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateWorkflowSchema } from "@/lib/validations/workflow";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;
  const validation = await validateRequestBody(request, updateWorkflowSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("workflows")
    .update({
      name: payload.name,
      description: payload.description ?? null,
      trigger_scope: payload.triggerScope,
      trigger_type: payload.triggerType,
      trigger_tag_id: payload.triggerTagId ?? null,
      conditions: payload.conditions ?? {},
      actions: payload.actions ?? [],
      delay_minutes: payload.delayMinutes ?? 0,
      is_active: payload.isActive ?? true,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id, name, description, trigger_scope, trigger_type, trigger_tag_id, conditions, actions, delay_minutes, is_active, is_system")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update workflow." }, { status: 500 });
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("workflows")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to delete workflow." }, { status: 500 });
  }

  return NextResponse.json(true);
}
