import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;
  const body = await request.json();

  // First verify the inspection service belongs to this tenant
  const { data: service, error: fetchError } = await supabaseAdmin
    .from("inspection_services")
    .select("inspection_id, inspections!inner(tenant_id)")
    .eq("id", id)
    .single();

  if (fetchError || !service) {
    return NextResponse.json({ error: "Inspection service not found" }, { status: 404 });
  }

  // TypeScript workaround for nested relation
  const inspections = service.inspections as unknown as { tenant_id: string } | { tenant_id: string }[];
  const inspection = Array.isArray(inspections) ? inspections[0] : inspections;

  if (inspection.tenant_id !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Update the inspection service
  const updateData: { inspector_id?: string | null; vendor_id?: string | null } = {};
  if (body.inspector_id !== undefined) {
    updateData.inspector_id = body.inspector_id;
  }
  if (body.vendor_id !== undefined) {
    updateData.vendor_id = body.vendor_id;
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("inspection_services")
    .update(updateData)
    .eq("id", id)
    .select(
      `
      *,
      inspector:inspector_id(id, full_name, email, avatar_url),
      vendor:vendor_id(id, name, type, contact)
    `
    )
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
