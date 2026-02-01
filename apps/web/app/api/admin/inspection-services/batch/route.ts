import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

type ServiceUpdate = {
  id: string;
  inspector_id?: string | null;
  vendor_id?: string | null;
};

export async function PATCH(request: Request) {
  const tenantId = getTenantId();
  const body = await request.json();
  const updates: ServiceUpdate[] = body.updates ?? [];

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const serviceIds = updates.map((u) => u.id);

  // Verify all services belong to this tenant
  const { data: services, error: fetchError } = await supabaseAdmin
    .from("inspection_services")
    .select("id, inspection_id, inspections!inner(tenant_id)")
    .in("id", serviceIds);

  if (fetchError || !services) {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }

  // Check tenant access for all services
  for (const service of services) {
    const inspections = service.inspections as unknown as { tenant_id: string } | { tenant_id: string }[];
    const inspection = Array.isArray(inspections) ? inspections[0] : inspections;
    if (inspection.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Perform updates
  const results = [];
  for (const update of updates) {
    const updateData: { inspector_id?: string | null; vendor_id?: string | null } = {};
    if (update.inspector_id !== undefined) {
      updateData.inspector_id = update.inspector_id;
    }
    if (update.vendor_id !== undefined) {
      updateData.vendor_id = update.vendor_id;
    }

    const { data, error } = await supabaseAdmin
      .from("inspection_services")
      .update(updateData)
      .eq("id", update.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Failed to update service ${update.id}: ${error.message}` }, { status: 500 });
    }

    results.push(data);
  }

  return NextResponse.json({ updated: results });
}
