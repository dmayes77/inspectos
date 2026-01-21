import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { getCrmLeads } from "@/lib/mock/erp";

const normalizeStage = (stage: string) => stage.toLowerCase().replace(/\s+/g, "_");

export async function POST() {
  const tenantId = getTenantId();
  const leads = getCrmLeads();

  const { data: existing } = await supabaseAdmin
    .from("leads")
    .select("id, email, name")
    .eq("tenant_id", tenantId);

  const existingKeys = new Set((existing ?? []).map((lead) => (lead.email || lead.name).toLowerCase()));

  const inserts = leads
    .filter((lead) => !existingKeys.has((lead.email || lead.name).toLowerCase()))
    .map((lead) => ({
      tenant_id: tenantId,
      name: lead.name,
      email: lead.email ?? null,
      stage: normalizeStage(lead.stage),
      service_name: lead.service ?? null,
      requested_date: lead.requestedDate || null,
      estimated_value: lead.value ?? null,
    }));

  if (inserts.length === 0) {
    return NextResponse.json({ message: "No new leads to seed." });
  }

  const { error } = await supabaseAdmin.from("leads").insert(inserts);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Seeded ${inserts.length} leads.` });
}
