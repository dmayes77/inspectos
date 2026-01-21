import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createLeadSchema } from "@/lib/validations/lead";

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

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(mapLead));
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createLeadSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert({
      tenant_id: tenantId,
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
    .select("id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create lead." }, { status: 500 });
  }

  return NextResponse.json(mapLead(data));
}
