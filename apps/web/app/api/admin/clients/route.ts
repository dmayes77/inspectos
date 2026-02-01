import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createClientSchema } from "@/lib/validations/client";

const mapClient = (client: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string | null;
  inspections_count: number | null;
  last_inspection_date: string | null;
  total_spent: number | null;
  created_at: string | null;
  updated_at: string | null;
}) => ({
  clientId: client.id,
  name: client.name,
  email: client.email ?? "",
  phone: client.phone ?? "",
  type: client.type ?? "Homebuyer",
  inspections: client.inspections_count ?? 0,
  lastInspection: client.last_inspection_date ?? "—",
  totalSpent: Number(client.total_spent ?? 0),
  createdAt: client.created_at ?? null,
  updatedAt: client.updated_at ?? null,
});

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("id, name, email, phone, type, inspections_count, last_inspection_date, total_spent, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(mapClient));
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createClientSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      type: payload.type ?? null,
      company: payload.company ?? null,
      notes: payload.notes ?? null,
    })
    .select("id, name, email, phone, type, inspections_count, last_inspection_date, total_spent, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create client." }, { status: 500 });
  }

  // Trigger webhook for client.created event
  try {
    const { triggerWebhookEvent } = await import("@/lib/webhooks/delivery");
    const { buildClientPayload } = await import("@/lib/webhooks/payloads");

    // Fetch complete client data including company and notes
    const { data: completeClient } = await supabaseAdmin
      .from("clients")
      .select("id, name, email, phone, company, notes, created_at, updated_at")
      .eq("id", data.id)
      .single();

    if (completeClient) {
      triggerWebhookEvent("client.created", tenantId, buildClientPayload(completeClient));
    }
  } catch (error) {
    console.error("Failed to trigger webhook:", error);
  }

  return NextResponse.json(mapClient(data));
}
