import { supabaseAdmin } from "@/lib/supabase/server";

export async function assignInspectionLead(
  tenantId: string,
  inspectionId: string,
  inspectorId: string
) {
  if (!inspectorId) return;
  await supabaseAdmin.from("inspection_assignments").insert({
    tenant_id: tenantId,
    inspection_id: inspectionId,
    inspector_id: inspectorId,
    role: "lead",
  });
}

export async function unassignInspectionRanks(
  tenantId: string,
  inspectionId: string
) {
  return supabaseAdmin
    .from("inspection_assignments")
    .update({ unassigned_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("inspection_id", inspectionId)
    .is("unassigned_at", null);
}
