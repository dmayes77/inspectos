import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateOrderSchema } from "@/lib/validations/order";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      property:properties(
        id, address_line1, address_line2, city, state, zip_code, property_type,
        year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool,
        basement, lot_size_acres, heating_type, cooling_type, roof_type,
        building_class, loading_docks, zoning, occupancy_type, ceiling_height,
        number_of_units, unit_mix, laundry_type, parking_spaces, elevator
      ),
      client:clients(id, name, email, phone, company, notes),
      agent:agents(id, name, email, phone, license_number, agency:agencies(id, name, email, phone)),
      inspector:profiles(id, full_name, email, avatar_url),
      inspection:inspections(
        id, order_id, status, started_at, completed_at, weather_conditions, temperature, notes,
        services:inspection_services(id, service_id, name, status, price, duration_minutes, template_id, notes, sort_order)
      ),
      invoices(id, status, total, issued_at, due_at)
    `)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Order not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, updateOrderSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};
  if (payload.client_id !== undefined) updateData.client_id = payload.client_id;
  if (payload.agent_id !== undefined) updateData.agent_id = payload.agent_id;
  if (payload.inspector_id !== undefined) updateData.inspector_id = payload.inspector_id;
  if (payload.property_id !== undefined) updateData.property_id = payload.property_id;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.scheduled_date !== undefined) updateData.scheduled_date = payload.scheduled_date;
  if (payload.scheduled_time !== undefined) updateData.scheduled_time = payload.scheduled_time;
  if (payload.duration_minutes !== undefined) updateData.duration_minutes = payload.duration_minutes;
  if (payload.services) {
    const subtotal = payload.services.reduce((sum, service) => sum + service.price, 0);
    const duration = payload.services.reduce(
      (sum, service) => sum + (service.duration_minutes ?? 0),
      0
    );
    if (payload.subtotal === undefined) updateData.subtotal = subtotal;
    if (payload.total === undefined) updateData.total = subtotal;
    if (payload.duration_minutes === undefined && duration > 0) {
      updateData.duration_minutes = duration;
    }
  }
  if (payload.subtotal !== undefined) updateData.subtotal = payload.subtotal;
  if (payload.discount !== undefined) updateData.discount = payload.discount;
  if (payload.tax !== undefined) updateData.tax = payload.tax;
  if (payload.total !== undefined) updateData.total = payload.total;
  if (payload.payment_status !== undefined) updateData.payment_status = payload.payment_status;
  if (payload.report_delivered_at !== undefined) updateData.report_delivered_at = payload.report_delivered_at;
  if (payload.source !== undefined) updateData.source = payload.source;
  if (payload.internal_notes !== undefined) updateData.internal_notes = payload.internal_notes;
  if (payload.client_notes !== undefined) updateData.client_notes = payload.client_notes;

  // Handle status transitions
  if (payload.status === "completed" && !updateData.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select(`
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
    `)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Failed to update order." } },
      { status: 500 }
    );
  }

  if (payload.services) {
    let inspectionId = data.inspection?.id ?? null;
    if (!inspectionId) {
      const { data: createdInspection, error: inspectionError } = await supabaseAdmin
        .from("inspections")
        .insert({
          tenant_id: tenantId,
          order_id: data.id,
          template_id: payload.services[0]?.template_id ?? null,
          template_version: 1,
          inspector_id: data.inspector_id ?? null,
          status: "draft",
        })
        .select("id")
        .single();

      if (inspectionError || !createdInspection) {
        return NextResponse.json(
          { error: { message: inspectionError?.message ?? "Failed to create inspection." } },
          { status: 500 }
        );
      }
      inspectionId = createdInspection.id;
    }

    await supabaseAdmin.from("inspection_services").delete().eq("inspection_id", inspectionId);

    const inspectionServices = payload.services.map((service, index) => ({
      inspection_id: inspectionId,
      service_id: service.service_id,
      template_id: service.template_id ?? null,
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes ?? null,
      status: "pending" as const,
      sort_order: index,
    }));

    const { error: servicesError } = await supabaseAdmin
      .from("inspection_services")
      .insert(inspectionServices);

    if (servicesError) {
      return NextResponse.json(
        { error: { message: servicesError.message } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  // Check if order can be deleted (not completed or in_progress)
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("status")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (order && ["completed", "in_progress"].includes(order.status)) {
    return NextResponse.json(
      { error: { message: "Cannot delete an order that is in progress or completed." } },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
