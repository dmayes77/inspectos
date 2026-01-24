import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { normalizeAddressParts } from "@/lib/utils/address";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;
  const propertyId = id?.trim?.() ?? "";

  const { data: property, error } = await supabaseAdmin
    .from("properties")
    .select(`
      *,
      client:clients(id, name, email, phone, company)
    `)
    .eq("id", propertyId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !property) {
    return NextResponse.json(
      { error: { message: error?.message || "Property not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: property });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;
  const propertyId = id?.trim?.() ?? "";
  const allowedPropertyTypes = new Set([
    "single-family",
    "condo-townhome",
    "multi-family",
    "manufactured",
    "commercial",
  ]);

  try {
    const body = await request.json();

    // Update property
    const normalized = normalizeAddressParts({
      street: body.address_line1 ?? "",
      city: body.city ?? "",
      state: body.state ?? "",
      zip: body.zip_code ?? "",
    });
    const normalizedLine2 = body.address_line2 ? normalizeAddressParts({ street: body.address_line2 }).street : null;

    const normalizedPropertyType = allowedPropertyTypes.has(body.property_type)
      ? body.property_type
      : "single-family";

    const { data: property, error } = await supabaseAdmin
      .from("properties")
      .update({
        address_line1: normalized.street || body.address_line1,
        address_line2: normalizedLine2,
        city: normalized.city || body.city,
        state: normalized.state || body.state,
        zip_code: normalized.zip || body.zip_code,
        property_type: normalizedPropertyType,
        year_built: body.year_built || null,
        square_feet: body.square_feet || null,
        notes: body.notes || null,
        client_id: body.client_id || null,
        bedrooms: body.bedrooms ?? null,
        bathrooms: body.bathrooms ?? null,
        stories: body.stories ?? null,
        foundation: body.foundation ?? null,
        garage: body.garage ?? null,
        pool: body.pool ?? null,
        basement: body.basement ?? null,
        lot_size_acres: body.lot_size_acres ?? null,
        heating_type: body.heating_type ?? null,
        cooling_type: body.cooling_type ?? null,
        roof_type: body.roof_type ?? null,
        building_class: body.building_class ?? null,
        loading_docks: body.loading_docks ?? null,
        zoning: body.zoning ?? null,
        occupancy_type: body.occupancy_type ?? null,
        ceiling_height: body.ceiling_height ?? null,
        number_of_units: body.number_of_units ?? null,
        unit_mix: body.unit_mix ?? null,
        laundry_type: body.laundry_type ?? null,
        parking_spaces: body.parking_spaces ?? null,
        elevator: body.elevator ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", propertyId)
      .eq("tenant_id", tenantId)
      .select(`
        *,
        client:clients(id, name, email, phone, company)
      `)
      .single();

    if (error || !property) {
      console.error("Property update failed", {
        propertyId,
        propertyType: normalizedPropertyType,
        error,
      });
      return NextResponse.json(
        { error: { message: error?.message || "Failed to update property" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error("Property update request failed", { propertyId, error });
    return NextResponse.json(
      { error: { message: "Invalid request body" } },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;
  const propertyId = id?.trim?.() ?? "";

  // Check if property has any orders
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("property_id", propertyId)
    .eq("tenant_id", tenantId)
    .limit(1);

  if (orders && orders.length > 0) {
    return NextResponse.json(
      { error: { message: "Cannot delete property with existing orders" } },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
