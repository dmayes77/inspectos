import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateAgentSchema } from "@/lib/validations/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("agents")
    .select(`
      *,
      agency:agencies(id, name, email, phone),
      orders(id, order_number, status, scheduled_date, total, property:properties(address_line1, city, state))
    `)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Agent not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, updateAgentSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const updateData: Record<string, unknown> = {};
  if (payload.agency_id !== undefined) updateData.agency_id = payload.agency_id;
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.license_number !== undefined) updateData.license_number = payload.license_number;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.notes !== undefined) updateData.notes = payload.notes;
  if (payload.preferred_report_format !== undefined) updateData.preferred_report_format = payload.preferred_report_format;
  if (payload.notify_on_schedule !== undefined) updateData.notify_on_schedule = payload.notify_on_schedule;
  if (payload.notify_on_complete !== undefined) updateData.notify_on_complete = payload.notify_on_complete;
  if (payload.notify_on_report !== undefined) updateData.notify_on_report = payload.notify_on_report;

  const { data, error } = await supabaseAdmin
    .from("agents")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select(`
      *,
      agency:agencies(id, name)
    `)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Failed to update agent." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  // Check if agent has active orders
  const { count } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", id)
    .in("status", ["pending", "scheduled", "in_progress"]);

  if (count && count > 0) {
    return NextResponse.json(
      { error: { message: "Cannot delete agent with active orders. Complete or reassign orders first." } },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("agents")
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
