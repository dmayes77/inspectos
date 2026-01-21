import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { runWorkflowsForStatusChange } from "@/lib/admin/workflow-runner";
import { validateRequestBody } from "@/lib/api/validate";
import { updateLeadSchema } from "@/lib/validations/lead";

const normalizeStage = (stage?: string | null) => {
  if (!stage) return "new";
  return stage.toLowerCase().replace(/\s+/g, "_");
};

const mapLead = (lead: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: string;
  source: string | null;
  notes: string | null;
  service_name: string | null;
  requested_date: string | null;
  estimated_value: number | null;
}) => ({
  leadId: lead.id,
  name: lead.name,
  email: lead.email ?? "",
  phone: lead.phone ?? "",
  stage: lead.stage,
  source: lead.source ?? "",
  notes: lead.notes ?? "",
  serviceName: lead.service_name ?? "",
  requestedDate: lead.requested_date ?? "",
  estimatedValue: Number(lead.estimated_value ?? 0),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Lead not found." }, { status: 404 });
  }

  return NextResponse.json(mapLead(data));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, updateLeadSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data: existing } = await supabaseAdmin
    .from("leads")
    .select("stage")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  const { data, error } = await supabaseAdmin
    .from("leads")
    .update({
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      stage: normalizeStage(payload.stage),
      source: payload.source ?? null,
      notes: payload.notes ?? null,
      service_name: payload.serviceName ?? null,
      requested_date: payload.requestedDate || null,
      estimated_value: payload.estimatedValue ?? null,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update lead." }, { status: 500 });
  }

  if (existing?.stage && existing.stage !== data.stage) {
    await runWorkflowsForStatusChange({
      tenantId,
      scope: "lead",
      entityId: id,
      triggerType: "status_changed",
      status: data.stage,
    });
  }

  return NextResponse.json(mapLead(data));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("leads")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
