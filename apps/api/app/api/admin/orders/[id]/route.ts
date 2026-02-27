import {
  badRequest,
  notFound,
  serverError,
  success
} from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { updateOrderSchema } from '@inspectos/shared/validations/order';
import { format } from 'date-fns';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { resolveIdLookup } from '@/lib/identifiers/lookup';
import {
  buildOrderUpdatedPayload,
  buildOrderCompletedPayload,
  buildOrderCancelledPayload,
  buildSchedulePayload
} from '@/lib/webhooks/payloads';

const mapOrderStatusToScheduleStatus = (status?: string | null, scheduledDate?: string | null) => {
  switch (status) {
    case "scheduled": return "scheduled";
    case "in_progress": return "in_progress";
    case "pending_report":
    case "delivered":
    case "completed": return "completed";
    case "cancelled": return "cancelled";
    default: return scheduledDate ? "scheduled" : "pending";
  }
};

const derivePrimaryContactType = (clientId?: string | null, agentId?: string | null): "agent" | "client" | null => {
  if (agentId) return "agent";
  if (clientId) return "client";
  return null;
};

const ORDER_DETAIL_SELECT = `
  *,
  property:properties(
    id, public_id, address_line1, address_line2, city, state, zip_code, property_type,
    year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool,
    basement, lot_size_acres, heating_type, cooling_type, roof_type,
    building_class, loading_docks, zoning, occupancy_type, ceiling_height,
    number_of_units, unit_mix, laundry_type, parking_spaces, elevator
  ),
  client:clients(id, public_id, name, email, phone, company, notes),
  agent:agents(id, public_id, name, email, phone, license_number, agency:agencies(id, name, email, phone)),
  inspector:profiles(id, full_name, email, avatar_url),
  schedules:order_schedules(
    id, tenant_id, order_id, schedule_type, label, service_id, package_id,
    inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes
  ),
  services:order_services(
    id, service_id, name, status, price, duration_minutes, template_id, sort_order, notes, inspector_id, vendor_id,
    inspector:profiles!inspection_services_inspector_id_fkey(id, full_name, email, avatar_url),
    vendor:vendors!inspection_services_vendor_id_fkey(id, name, vendor_type, email, phone)
  ),
  assignments:inspection_assignments(
    id, role, assigned_at, unassigned_at,
    inspector:profiles(id, full_name, email, avatar_url)
  ),
  invoices(id, status, total, issued_at, due_at)
`;

/**
 * GET /api/admin/orders/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;
  const lookup = resolveIdLookup(id, { publicColumn: "order_number", transformPublicValue: (value) => value.toUpperCase() });

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_SELECT)
    .eq("tenant_id", tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();

  if (error || !data) return notFound(error?.message ?? "Order not found.");
  return success(data);
});

/**
 * PUT /api/admin/orders/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;
  const lookup = resolveIdLookup(id, { publicColumn: "order_number", transformPublicValue: (value) => value.toUpperCase() });

  const validation = await validateRequestBody(request, updateOrderSchema);
  if (validation.error) return validation.error;
  const payload = validation.data;

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("id, status, client_id, agent_id, primary_contact_type")
    .eq("tenant_id", tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();

  if (!currentOrder?.id) return notFound("Order not found.");

  const previousStatus = currentOrder?.status;

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
    const subtotal = payload.services.reduce((sum: number, s: { price: number }) => sum + s.price, 0);
    const duration = payload.services.reduce((sum: number, s: { duration_minutes?: number }) => sum + (s.duration_minutes ?? 0), 0);
    if (payload.subtotal === undefined) updateData.subtotal = subtotal;
    if (payload.total === undefined) updateData.total = subtotal;
    if (payload.duration_minutes === undefined && duration > 0) updateData.duration_minutes = duration;
    // Keep template_id in sync with first service
    if (payload.services[0]?.template_id) updateData.template_id = payload.services[0].template_id;
  }
  if (payload.subtotal !== undefined) updateData.subtotal = payload.subtotal;
  if (payload.discount !== undefined) updateData.discount = payload.discount;
  if (payload.tax !== undefined) updateData.tax = payload.tax;
  if (payload.total !== undefined) updateData.total = payload.total;
  if (payload.labor_cost !== undefined) updateData.labor_cost = payload.labor_cost;
  if (payload.travel_cost !== undefined) updateData.travel_cost = payload.travel_cost;
  if (payload.overhead_cost !== undefined) updateData.overhead_cost = payload.overhead_cost;
  if (payload.other_cost !== undefined) updateData.other_cost = payload.other_cost;
  if (payload.payment_status !== undefined) updateData.payment_status = payload.payment_status;
  if (payload.report_delivered_at !== undefined) updateData.report_delivered_at = payload.report_delivered_at;
  if (payload.source !== undefined) updateData.source = payload.source;
  if (payload.internal_notes !== undefined) updateData.internal_notes = payload.internal_notes;
  if (payload.client_notes !== undefined) updateData.client_notes = payload.client_notes;
  if (payload.primary_contact_type !== undefined) {
    updateData.primary_contact_type = payload.primary_contact_type;
  } else if (payload.client_id !== undefined || payload.agent_id !== undefined) {
    const effectiveClientId = payload.client_id !== undefined ? payload.client_id : (currentOrder?.client_id ?? null);
    const effectiveAgentId = payload.agent_id !== undefined ? payload.agent_id : (currentOrder?.agent_id ?? null);
    const existingPrimary = currentOrder?.primary_contact_type ?? null;

    const nextPrimary =
      existingPrimary === "agent" && !effectiveAgentId
        ? derivePrimaryContactType(effectiveClientId, effectiveAgentId)
        : existingPrimary === "client" && !effectiveClientId
          ? derivePrimaryContactType(effectiveClientId, effectiveAgentId)
          : existingPrimary ?? derivePrimaryContactType(effectiveClientId, effectiveAgentId);

    updateData.primary_contact_type = nextPrimary;
  }

  if (payload.status === "completed" && !updateData.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("tenant_id", tenant.id)
    .eq("id", currentOrder.id)
    .select(ORDER_DETAIL_SELECT)
    .single();

  if (error || !data) return serverError(error?.message ?? "Failed to update order.", error);

  // Update per-service inspector/vendor assignments if services payload provided
  if (payload.services && Array.isArray(payload.services) && payload.services.length > 0) {
    const existingServices = Array.isArray(data.services) ? data.services : [];
    for (const service of payload.services) {
      const existingService = existingServices.find(
        (s: { service_id: string | null; name: string }) =>
          (service.service_id && s.service_id === service.service_id) || s.name === service.name
      );
      if (existingService?.id) {
        const svcUpdate: { inspector_id?: string | null; vendor_id?: string | null } = {};
        if (service.inspector_id !== undefined) svcUpdate.inspector_id = service.inspector_id;
        if (service.vendor_id !== undefined) svcUpdate.vendor_id = service.vendor_id;
        if (Object.keys(svcUpdate).length > 0) {
          await supabase.from("order_services").update(svcUpdate).eq("id", existingService.id);
        }
      }
    }
  }

  const propertyId = data.property_id;
  const assignedClientId = data.client?.id ?? data.client_id ?? null;
  if (propertyId && assignedClientId) {
    const ownerDate = format(new Date(), "yyyy-MM-dd");
    await supabase.from("property_owners").update({ end_date: ownerDate, is_primary: false }).eq("tenant_id", tenant.id).eq("property_id", propertyId).is("end_date", null);
    await supabase.from("property_owners").insert({ tenant_id: tenant.id, property_id: propertyId, client_id: assignedClientId, start_date: ownerDate, is_primary: true });
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
      const { data: refreshedSchedule, error: scheduleUpdateError } = await supabase
        .from("order_schedules")
        .update(scheduleUpdate)
        .eq("id", primarySchedule.id)
        .select("id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes")
        .single();
      if (scheduleUpdateError) return serverError(scheduleUpdateError.message, scheduleUpdateError);
      primarySchedule = refreshedSchedule ?? { ...primarySchedule, ...scheduleUpdate };
    } else {
      const { data: insertedSchedule, error: scheduleInsertError } = await supabase
        .from("order_schedules")
        .insert({
          tenant_id: tenant.id,
          order_id: data.id,
          schedule_type: "primary",
          label: payload.services?.[0]?.name ?? data.services?.[0]?.name ?? "Primary Inspection",
          service_id: payload.services?.[0]?.service_id ?? data.services?.[0]?.service_id ?? null,
          ...scheduleUpdate,
        })
        .select("id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes")
        .single();
      if (scheduleInsertError) return serverError(scheduleInsertError.message, scheduleInsertError);
      primarySchedule = insertedSchedule ?? null;
    }

    scheduleChanged = true;

    if (primarySchedule) {
      try {
        const { data: completeSchedule } = await supabase
          .from("order_schedules")
          .select(`id, order_id, schedule_type, label, slot_date, slot_start, slot_end, duration_minutes, status, created_at, updated_at, inspector:profiles(id, full_name, email)`)
          .eq("id", primarySchedule.id)
          .single();

        if (completeSchedule) {
          const inspectorData = Array.isArray(completeSchedule.inspector) ? completeSchedule.inspector[0] : completeSchedule.inspector;
          const scheduleData = { ...completeSchedule, inspector: inspectorData || null };
          const wasJustCreated = !Array.isArray(data.schedules) || data.schedules.length === 0;

          if (wasJustCreated) {
            triggerWebhookEvent("schedule.created", tenant.id, buildSchedulePayload(scheduleData));
          } else {
            triggerWebhookEvent("schedule.updated", tenant.id, buildSchedulePayload(scheduleData));
            if (scheduleData.status === "cancelled") {
              triggerWebhookEvent("schedule.cancelled", tenant.id, buildSchedulePayload(scheduleData));
            }
          }
        }
      } catch (error) {
        console.error("Failed to trigger schedule webhook:", error);
      }
    }
  }

  if (scheduleChanged && primarySchedule) {
    const others = Array.isArray(data.schedules) ? data.schedules.filter((s: { id: string | null }) => s?.id !== primarySchedule.id) : [];
    data.schedules = [...others, primarySchedule];
  }

  // Replace order services if payload includes services
  if (payload.services && payload.services.length > 0) {
    await supabase.from("order_services").delete().eq("order_id", data.id);

    const orderServices = payload.services.map((service: { service_id: string; template_id?: string | null; name: string; price: number; duration_minutes?: number | null; inspector_id?: string | null; vendor_id?: string | null }, index: number) => ({
      order_id: data.id,
      service_id: service.service_id,
      template_id: service.template_id ?? null,
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes ?? null,
      inspector_id: service.inspector_id ?? null,
      vendor_id: service.vendor_id ?? null,
      status: "pending" as const,
      sort_order: index,
    }));

    const { error: servicesError } = await supabase.from("order_services").insert(orderServices);
    if (servicesError) return serverError(servicesError.message, servicesError);
  }

  try {
    triggerWebhookEvent("order.updated", tenant.id, buildOrderUpdatedPayload(data));
    if (payload.status === "completed" && previousStatus !== "completed") {
      triggerWebhookEvent("order.completed", tenant.id, buildOrderCompletedPayload(data));
    }
    if (payload.status === "cancelled" && previousStatus !== "cancelled") {
      triggerWebhookEvent("order.cancelled", tenant.id, buildOrderCancelledPayload(data));
    }
  } catch (error) {
    console.error("Failed to trigger webhook:", error);
  }

  return success(data);
});

/**
 * DELETE /api/admin/orders/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;
  const lookup = resolveIdLookup(id, { publicColumn: "order_number", transformPublicValue: (value) => value.toUpperCase() });

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("tenant_id", tenant.id)
    .eq(lookup.column, lookup.value)
    .limit(1)
    .maybeSingle();
  if (order && ["completed", "in_progress"].includes(order.status)) {
    return badRequest("Cannot delete an order that is in progress or completed.");
  }
  if (!order?.id) return notFound("Order not found.");

  const { error } = await supabase.from("orders").delete().eq("tenant_id", tenant.id).eq("id", order.id);
  if (error) return serverError('Failed to delete order', error);
  return success(true);
});
