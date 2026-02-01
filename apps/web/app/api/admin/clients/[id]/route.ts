import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateClientSchema } from "@/lib/validations/client";

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("id, name, email, phone, type, inspections_count, last_inspection_date, total_spent, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Client not found." }, { status: 404 });
  }

  const { data: properties, error: propertiesError } = await supabaseAdmin
    .from("properties")
    .select(
      `
      id,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      property_type,
      owners:property_owners!inner(client_id, end_date)
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("owners.client_id", id)
    .is("owners.end_date", null)
    .order("updated_at", { ascending: false });

  if (propertiesError) {
    return NextResponse.json({ error: propertiesError.message }, { status: 500 });
  }

  const mappedProperties = (properties ?? []).map((property) => ({
    propertyId: property.id,
    addressLine1: property.address_line1,
    addressLine2: property.address_line2,
    city: property.city,
    state: property.state,
    zipCode: property.zip_code,
    propertyType: property.property_type,
  }));

  return NextResponse.json({
    ...mapClient(data),
    properties: mappedProperties,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, updateClientSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.type !== undefined) updateData.type = payload.type;
  if (payload.company !== undefined) updateData.company = payload.company;
  if (payload.notes !== undefined) updateData.notes = payload.notes;

  const { data, error } = await supabaseAdmin
    .from("clients")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id, name, email, phone, type, inspections_count, last_inspection_date, total_spent, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update client." }, { status: 500 });
  }

  // Trigger webhook for client.updated event
  try {
    const { triggerWebhookEvent } = await import("@/lib/webhooks/delivery");
    const { buildClientPayload } = await import("@/lib/webhooks/payloads");

    // Fetch complete client data including company and notes
    const { data: completeClient } = await supabaseAdmin
      .from("clients")
      .select("id, name, email, phone, company, notes, created_at, updated_at")
      .eq("id", id)
      .single();

    if (completeClient) {
      triggerWebhookEvent("client.updated", tenantId, buildClientPayload(completeClient));
    }
  } catch (error) {
    console.error("Failed to trigger webhook:", error);
  }

  return NextResponse.json(mapClient(data));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { error } = await supabaseAdmin.from("clients").delete().eq("tenant_id", tenantId).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
