import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function POST() {
  const tenantId = getTenantId();
  const serviceName = "Standard Home Inspection";

  const { data: existingService, error: existingError } = await supabaseAdmin
    .from("services")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", serviceName)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingService?.id) {
    return NextResponse.json({ message: "Standard Home Inspection service already exists." });
  }

  const { data: template } = await supabaseAdmin
    .from("templates")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("name", ["Standard Home Inspection", "Full Home Inspection"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const { data: createdService, error: createError } = await supabaseAdmin
    .from("services")
    .insert({
      tenant_id: tenantId,
      name: serviceName,
      description: "Standard residential home inspection service.",
      category: "core",
      price: 425,
      duration_minutes: 240,
      template_id: template?.id ?? null,
      is_active: true,
    })
    .select("id")
    .single();

  if (createError || !createdService) {
    return NextResponse.json({ error: createError?.message ?? "Failed to create service." }, { status: 500 });
  }

  return NextResponse.json({ message: "Standard Home Inspection service created." });
}
