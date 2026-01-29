import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateOrderSchema } from "@/lib/validations/order";
import { format } from "date-fns";

const mapOrderStatusToScheduleStatus = (status?: string | null, scheduledDate?: string | null) => {
  switch (status) {
    case "scheduled":
      return "scheduled";
    case "in_progress":
      return "in_progress";
    case "pending_report":
    case "delivered":
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return scheduledDate ? "scheduled" : "pending";
  }
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
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
      client:clients(id, name, email, phone, company, notes),
      agent:agents(id, name, email, phone, license_number, agency:agencies(id, name, email, phone)),
      inspector:profiles(id, full_name, email, avatar_url),
      schedules:order_schedules(
        id, tenant_id, order_id, schedule_type, label, service_id, package_id,
        inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes
      ),
      inspection:inspections(
        id, order_id, order_schedule_id, status, started_at, completed_at, weather_conditions, temperature, notes,
        services:inspection_services(id, service_id, name, status, price, duration_minutes, template_id, notes, sort_order),
        assignments:inspection_assignments(
          id, role, assigned_at, unassigned_at,
          inspector:profiles(id, full_name, email, avatar_url)
        )
      ),
      invoices(id, status, total, issued_at, due_at)
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: { message: error?.message ?? "Order not found." } }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const duration = payload.services.reduce((sum, service) => sum + (service.duration_minutes ?? 0), 0);
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
      schedules:order_schedules(
        id, tenant_id, order_id, schedule_type, label, service_id, package_id,
        inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes
      ),
      inspection:inspections(
        id, order_id, order_schedule_id, status,
        services:inspection_services(id, service_id, name, status, price, duration_minutes, template_id),
        assignments:inspection_assignments(
          id, role, assigned_at, unassigned_at,
          inspector:profiles(id, full_name, email, avatar_url)
        )
      )
    `,
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: { message: error?.message ?? "Failed to update order." } }, { status: 500 });
  }

  const propertyId = data.property_id;
  const assignedClientId = data.client?.id ?? data.client_id ?? null;
  if (propertyId && assignedClientId) {
    const ownerDate = format(new Date(), "yyyy-MM-dd");
    await supabaseAdmin
      .from("property_owners")
      .update({ end_date: ownerDate, is_primary: false })
      .eq("tenant_id", tenantId)
      .eq("property_id", propertyId)
      .is("end_date", null);

    await supabaseAdmin.from("property_owners").insert({
      tenant_id: tenantId,
      property_id: propertyId,
      client_id: assignedClientId,
      start_date: ownerDate,
      is_primary: true,
    });
  }

  let primarySchedule = Array.isArray(data.schedules) && data.schedules.length > 0 ? data.schedules[0] : null;
  let scheduleChanged = false;
  const shouldSyncSchedule =
    payload.scheduled_date !== undefined ||
    payload.scheduled_time !== undefined ||
    payload.duration_minutes !== undefined ||
    payload.inspector_id !== undefined ||
    payload.status !== undefined;

  if (shouldSyncSchedule) {
    const scheduleUpdate: Record<string, unknown> = {};
    if (payload.scheduled_date !== undefined) scheduleUpdate.slot_date = payload.scheduled_date;
    if (payload.scheduled_time !== undefined) scheduleUpdate.slot_start = payload.scheduled_time;
    if (payload.duration_minutes !== undefined) scheduleUpdate.duration_minutes = payload.duration_minutes;
    if (payload.inspector_id !== undefined) scheduleUpdate.inspector_id = payload.inspector_id;
    scheduleUpdate.status = mapOrderStatusToScheduleStatus(payload.status ?? data.status, payload.scheduled_date ?? data.scheduled_date ?? null);

    if (primarySchedule) {
      const { data: refreshedSchedule, error: scheduleUpdateError } = await supabaseAdmin
        .from("order_schedules")
        .update(scheduleUpdate)
        .eq("id", primarySchedule.id)
        .select(
          "id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes",
        )
        .single();
      if (scheduleUpdateError) {
        return NextResponse.json({ error: { message: scheduleUpdateError.message } }, { status: 500 });
      }
      primarySchedule = refreshedSchedule ?? { ...primarySchedule, ...scheduleUpdate };
    } else {
      const { data: insertedSchedule, error: scheduleInsertError } = await supabaseAdmin
        .from("order_schedules")
        .insert({
          tenant_id: tenantId,
          order_id: data.id,
          schedule_type: "primary",
          label: payload.services?.[0]?.name ?? data.inspection?.services?.[0]?.name ?? "Primary Inspection",
          service_id: payload.services?.[0]?.service_id ?? data.inspection?.services?.[0]?.service_id ?? null,
          ...scheduleUpdate,
        })
        .select(
          "id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes",
        )
        .single();
      if (scheduleInsertError) {
        return NextResponse.json({ error: { message: scheduleInsertError.message } }, { status: 500 });
      }
      primarySchedule = insertedSchedule ?? null;
    }

    if (primarySchedule && data.inspection?.id && !data.inspection.order_schedule_id) {
      await supabaseAdmin.from("inspections").update({ order_schedule_id: primarySchedule.id }).eq("id", data.inspection.id);
      data.inspection.order_schedule_id = primarySchedule.id;
    }

    scheduleChanged = true;
  }

  if (scheduleChanged && primarySchedule) {
    const others = Array.isArray(data.schedules) ? data.schedules.filter((schedule: { id: string | null }) => schedule?.id !== primarySchedule.id) : [];
    data.schedules = [...others, primarySchedule];
  }

  if (payload.services) {
    let inspectionId = data.inspection?.id ?? null;
    if (!inspectionId) {
      const { data: createdInspection, error: inspectionError } = await supabaseAdmin
        .from("inspections")
        .insert({
          tenant_id: tenantId,
          order_id: data.id,
          order_schedule_id: primarySchedule?.id ?? null,
          template_id: payload.services[0]?.template_id ?? null,
          template_version: 1,
          status: "draft",
        })
        .select("id, order_schedule_id")
        .single();

      if (inspectionError || !createdInspection) {
        return NextResponse.json({ error: { message: inspectionError?.message ?? "Failed to create inspection." } }, { status: 500 });
      }
      inspectionId = createdInspection.id;
      data.inspection = {
        ...(data.inspection ?? {}),
        id: inspectionId,
        order_schedule_id: createdInspection.order_schedule_id ?? primarySchedule?.id ?? null,
      } as typeof data.inspection;
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

    const { error: servicesError } = await supabaseAdmin.from("inspection_services").insert(inspectionServices);

    if (servicesError) {
      return NextResponse.json({ error: { message: servicesError.message } }, { status: 500 });
    }
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  // Check if order can be deleted (not completed or in_progress)
  const { data: order } = await supabaseAdmin.from("orders").select("status").eq("tenant_id", tenantId).eq("id", id).single();

  if (order && ["completed", "in_progress"].includes(order.status)) {
    return NextResponse.json({ error: { message: "Cannot delete an order that is in progress or completed." } }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("orders").delete().eq("tenant_id", tenantId).eq("id", id);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
