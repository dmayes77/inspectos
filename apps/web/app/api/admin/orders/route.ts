import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createOrderSchema } from "@/lib/validations/order";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const tenantId = getTenantId();
  const searchParams = request.nextUrl.searchParams;

  // Build query
  let query = supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      property:properties(
        id, address_line1, address_line2, city, state, zip_code, property_type,
        year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool,
        basement, lot_size_acres, heating_type, cooling_type, roof_type,
        building_class, loading_docks, zoning, occupancy_type, ceiling_height,
        number_of_units, unit_mix, laundry_type, parking_spaces, elevator
      ),
      client:clients(id, name, email, phone, company),
      agent:agents(id, name, email, phone, agency:agencies(id, name)),
      inspector:profiles(id, full_name, email, avatar_url),
      inspection:inspections(
        id, order_id, status, started_at, completed_at,
        services:inspection_services(id, service_id, name, status, price, duration_minutes, template_id),
        assignments:inspection_assignments(
          id, role, assigned_at, unassigned_at,
          inspector:profiles(id, full_name, email, avatar_url)
        )
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Apply filters
  const status = searchParams.get("status");
  if (status) {
    query = query.eq("status", status);
  }

  const paymentStatus = searchParams.get("payment_status");
  if (paymentStatus) {
    query = query.eq("payment_status", paymentStatus);
  }

  const inspectorId = searchParams.get("inspector_id");
  if (inspectorId) {
    query = query.eq("inspector_id", inspectorId);
  }

  const clientId = searchParams.get("client_id");
  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const agentId = searchParams.get("agent_id");
  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const from = searchParams.get("from");
  if (from) {
    query = query.gte("scheduled_date", from);
  }

  const to = searchParams.get("to");
  if (to) {
    query = query.lte("scheduled_date", to);
  }

  const search = searchParams.get("search");
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,internal_notes.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createOrderSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  // Calculate totals from services
  const subtotal = payload.services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = payload.services.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

  // Create the order
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      tenant_id: tenantId,
      client_id: payload.client_id ?? null,
      agent_id: payload.agent_id ?? null,
      inspector_id: payload.inspector_id ?? null,
      property_id: payload.property_id,
      status: payload.scheduled_date && payload.inspector_id ? "scheduled" : "pending",
      scheduled_date: payload.scheduled_date ?? null,
      scheduled_time: payload.scheduled_time ?? null,
      duration_minutes: payload.duration_minutes ?? totalDuration ?? 120,
      subtotal,
      total: subtotal,
      source: payload.source ?? null,
      internal_notes: payload.internal_notes ?? null,
      client_notes: payload.client_notes ?? null,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Order creation failed", {
      tenantId,
      payload,
      orderError,
    });
    return NextResponse.json({ error: { message: orderError?.message ?? "Failed to create order." } }, { status: 500 });
  }

  if (payload.client_id) {
    const ownerDate = format(new Date(), "yyyy-MM-dd");
    await supabaseAdmin
      .from("property_owners")
      .update({ end_date: ownerDate, is_primary: false })
      .eq("tenant_id", tenantId)
      .eq("property_id", payload.property_id)
      .is("end_date", null);

    await supabaseAdmin.from("property_owners").insert({
      tenant_id: tenantId,
      property_id: payload.property_id,
      client_id: payload.client_id,
      start_date: ownerDate,
      is_primary: true,
    });
  }

  // Create inspection for this order
  const { data: inspection, error: inspectionError } = await supabaseAdmin
    .from("inspections")
    .insert({
      tenant_id: tenantId,
      order_id: order.id,
      template_id: payload.services[0]?.template_id ?? null,
      template_version: 1,
      status: "draft" as const,
    })
    .select()
    .single();

  if (inspectionError) {
    // Rollback order creation
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: { message: inspectionError.message } }, { status: 500 });
  }

  // Create inspection services
  const inspectionServices = payload.services.map((service, index) => ({
    inspection_id: inspection.id,
    service_id: service.service_id,
    template_id: service.template_id ?? null,
    name: service.name,
    price: service.price,
    duration_minutes: service.duration_minutes ?? null,
    status: "pending" as const,
    sort_order: index,
  }));

  const { error: servicesError } = await supabaseAdmin.from("inspection_services").insert(inspectionServices);

  if (servicesError) {
    // Rollback
    await supabaseAdmin.from("inspections").delete().eq("id", inspection.id);
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: { message: servicesError.message } }, { status: 500 });
  }

  // Fetch the complete order with relations
  const { data: completeOrder, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select(
      `
      *,
      property:properties(
        id, address_line1, address_line2, city, state, zip_code, property_type,
        year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool,
        basement, lot_size_acres, heating_type, cooling_type, roof_type,
        building_class, loading_docks, zoning, occupancy_type, ceiling_height,
        number_of_units, unit_mix, laundry_type, parking_spaces, elevator
      ),
      client:clients(id, name, email, phone),
      agent:agents(id, name, email, phone),
      inspector:profiles(id, full_name, email),
      inspection:inspections(
        id, order_id, status,
        services:inspection_services(id, service_id, name, status, price, duration_minutes, template_id)
      )
    `,
    )
    .eq("id", order.id)
    .single();

  if (fetchError) {
    console.error("Failed to fetch complete order", {
      orderId: order.id,
      fetchError,
    });
    return NextResponse.json({ error: { message: fetchError.message } }, { status: 500 });
  }

  return NextResponse.json({ data: completeOrder });
}
