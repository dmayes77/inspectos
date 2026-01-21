import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { services as mockServices } from "@/lib/mock/services";

export async function POST() {
  const tenantId = getTenantId();

  const { data: existingServices, error: existingError } = await supabaseAdmin
    .from("services")
    .select("id, name")
    .eq("tenant_id", tenantId);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingNames = new Set((existingServices ?? []).map((service) => service.name.toLowerCase()));
  const toInsert = mockServices
    .filter((service) => !existingNames.has(service.name.toLowerCase()))
    .map((service) => ({
      tenant_id: tenantId,
      name: service.name,
      description: service.description ?? null,
      category: service.category ?? "core",
      price: service.price ?? null,
      duration_minutes: service.durationMinutes ?? null,
      is_active: service.status !== "inactive",
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ message: "All services already exist." });
  }

  const { error: insertError } = await supabaseAdmin.from("services").insert(toInsert);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Seeded ${toInsert.length} services.` });
}
