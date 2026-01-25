import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { normalizeAddressParts } from "@/lib/utils/address";
import { mapPropertyWithOwners, PROPERTY_OWNER_SELECT, PropertyOwnerRow, normalizeOwnerRows } from "./helpers";

export async function GET(request: NextRequest) {
  const tenantId = getTenantId();
  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get("client_id");

  let query = supabaseAdmin
    .from("properties")
    .select(`*, owners:property_owners(${PROPERTY_OWNER_SELECT})`)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("owners.client_id", clientId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load properties", { tenantId, clientId, error });
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  const responsePayload = (data ?? []).map((property) => mapPropertyWithOwners(property, normalizeOwnerRows(property.owners ?? [])));

  return NextResponse.json({ data: responsePayload });
}

export async function POST(request: Request) {
  const tenantId = getTenantId();
  const body = await request.json();

  const {
    client_id,
    address_line1,
    address_line2,
    city,
    state,
    zip_code,
    property_type,
    year_built,
    square_feet,
    notes,
    bedrooms,
    bathrooms,
    stories,
    foundation,
    garage,
    pool,
    basement,
    lot_size_acres,
    heating_type,
    cooling_type,
    roof_type,
    building_class,
    loading_docks,
    zoning,
    occupancy_type,
    ceiling_height,
    number_of_units,
    unit_mix,
    laundry_type,
    parking_spaces,
    elevator,
  } = body ?? {};

  const normalized = normalizeAddressParts({
    street: address_line1 ?? "",
    city: city ?? "",
    state: state ?? "",
    zip: zip_code ?? "",
  });
  const normalizedLine2 = address_line2 ? normalizeAddressParts({ street: address_line2 }).street : null;

  if (!normalized.street || !normalized.city || !normalized.state || !normalized.zip) {
    return NextResponse.json({ error: { message: "Missing required fields: address_line1, city, state, zip_code" } }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("properties")
    .insert({
      tenant_id: tenantId,
      address_line1: normalized.street,
      address_line2: normalizedLine2,
      city: normalized.city,
      state: normalized.state,
      zip_code: normalized.zip,
      property_type: property_type ?? "single-family",
      year_built: year_built ?? null,
      square_feet: square_feet ?? null,
      notes: notes ?? null,
      bedrooms: bedrooms ?? null,
      bathrooms: bathrooms ?? null,
      stories: stories ?? null,
      foundation: foundation ?? null,
      garage: garage ?? null,
      pool: pool ?? null,
      basement: basement ?? null,
      lot_size_acres: lot_size_acres ?? null,
      heating_type: heating_type ?? null,
      cooling_type: cooling_type ?? null,
      roof_type: roof_type ?? null,
      building_class: building_class ?? null,
      loading_docks: loading_docks ?? null,
      zoning: zoning ?? null,
      occupancy_type: occupancy_type ?? null,
      ceiling_height: ceiling_height ?? null,
      number_of_units: number_of_units ?? null,
      unit_mix: unit_mix ?? null,
      laundry_type: laundry_type ?? null,
      parking_spaces: parking_spaces ?? null,
      elevator: elevator ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: { message: error?.message ?? "Failed to create property." } }, { status: 500 });
  }

  const ownerRows: PropertyOwnerRow[] = [];

  if (client_id) {
    const { data: ownerRow, error: ownerError } = await supabaseAdmin
      .from("property_owners")
      .insert({
        tenant_id: tenantId,
        property_id: data.id,
        client_id,
        is_primary: true,
      })
      .select(PROPERTY_OWNER_SELECT)
      .single();

    if (ownerError) {
      console.error("Failed to create property owner", { error: ownerError });
    } else if (ownerRow) {
      ownerRows.push(...normalizeOwnerRows([ownerRow]));
    }
  }

  const propertyResponse = mapPropertyWithOwners(data, ownerRows);

  return NextResponse.json({ data: propertyResponse });
}
