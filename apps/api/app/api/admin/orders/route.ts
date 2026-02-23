import {
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { validateRequestBody } from '@/lib/api/validate';
import { createOrderSchema } from '@inspectos/shared/validations/order';
import { format } from 'date-fns';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { buildOrderCreatedPayload, buildSchedulePayload } from '@/lib/webhooks/payloads';

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

const ORDER_SELECT = `
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
  )
`;

/**
 * GET /api/admin/orders
 */
export const GET = withAuth(async ({ supabase, tenant, request }) => {
  const searchParams = request.nextUrl.searchParams;

  let query = supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const status = searchParams.get("status");
  if (status) query = query.eq("status", status);

  const paymentStatus = searchParams.get("payment_status");
  if (paymentStatus) query = query.eq("payment_status", paymentStatus);

  const inspectorId = searchParams.get("inspector_id");
  if (inspectorId) query = query.eq("inspector_id", inspectorId);

  const clientId = searchParams.get("client_id");
  if (clientId) query = query.eq("client_id", clientId);

  const agentId = searchParams.get("agent_id");
  if (agentId) query = query.eq("agent_id", agentId);

  const from = searchParams.get("from");
  if (from) query = query.gte("scheduled_date", from);

  const to = searchParams.get("to");
  if (to) query = query.lte("scheduled_date", to);

  const search = searchParams.get("search");
  if (search) query = query.or(`order_number.ilike.%${search}%,internal_notes.ilike.%${search}%`);

  const { data, error } = await query;

  if (error) return serverError('Failed to fetch orders', error);
  return success(data ?? []);
});

/**
 * POST /api/admin/orders
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const validation = await validateRequestBody(request, createOrderSchema);
  if (validation.error) return validation.error;
  const payload = validation.data;

  const subtotal = payload.services.reduce((sum: number, s: { price: number }) => sum + s.price, 0);
  const totalDuration = payload.services.reduce((sum: number, s: { duration_minutes?: number }) => sum + (s.duration_minutes ?? 0), 0);

  // Create the order (now includes template fields directly)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenant.id,
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
      labor_cost: payload.labor_cost ?? 0,
      travel_cost: payload.travel_cost ?? 0,
      overhead_cost: payload.overhead_cost ?? 0,
      other_cost: payload.other_cost ?? 0,
      source: payload.source ?? null,
      internal_notes: payload.internal_notes ?? null,
      client_notes: payload.client_notes ?? null,
      template_id: payload.services[0]?.template_id ?? null,
      template_version: 1,
    })
    .select()
    .single();

  if (orderError || !order) {
    return serverError(orderError?.message ?? "Failed to create order.", orderError);
  }

  // Create primary schedule slot
  const scheduleDuration = payload.duration_minutes ?? totalDuration ?? 120;
  const scheduleStatus = mapOrderStatusToScheduleStatus(order.status, payload.scheduled_date ?? null);
  const scheduleLabel = payload.services[0]?.name ?? "Primary Inspection";

  const { data: primarySchedule, error: scheduleError } = await supabase
    .from("order_schedules")
    .insert({
      tenant_id: tenant.id,
      order_id: order.id,
      schedule_type: "primary",
      label: scheduleLabel,
      service_id: payload.services[0]?.service_id ?? null,
      inspector_id: payload.inspector_id ?? null,
      slot_date: payload.scheduled_date ?? null,
      slot_start: payload.scheduled_time ?? null,
      duration_minutes: scheduleDuration,
      status: scheduleStatus,
      notes: payload.internal_notes ?? null,
    })
    .select("id")
    .single();

  if (scheduleError || !primarySchedule) {
    await supabase.from("orders").delete().eq("id", order.id);
    return serverError(scheduleError?.message ?? "Failed to create schedule.", scheduleError);
  }

  // Trigger schedule.created webhook
  try {
    const { data: completeSchedule } = await supabase
      .from("order_schedules")
      .select(`id, order_id, schedule_type, label, slot_date, slot_start, slot_end, duration_minutes, status, created_at, updated_at, inspector:profiles(id, full_name, email)`)
      .eq("id", primarySchedule.id)
      .single();

    if (completeSchedule) {
      const inspectorData = Array.isArray(completeSchedule.inspector) ? completeSchedule.inspector[0] : completeSchedule.inspector;
      triggerWebhookEvent("schedule.created", tenant.id, buildSchedulePayload({ ...completeSchedule, inspector: inspectorData || null }));
    }
  } catch (error) {
    console.error("Failed to trigger schedule webhook:", error);
  }

  if (payload.client_id) {
    const ownerDate = format(new Date(), "yyyy-MM-dd");
    await supabase.from("property_owners").update({ end_date: ownerDate, is_primary: false }).eq("tenant_id", tenant.id).eq("property_id", payload.property_id).is("end_date", null);
    await supabase.from("property_owners").insert({ tenant_id: tenant.id, property_id: payload.property_id, client_id: payload.client_id, start_date: ownerDate, is_primary: true });
  }

  // Create order services (line items) directly on the order — no separate inspections row
  const orderServices = payload.services.map((service: { service_id: string; template_id?: string | null; name: string; price: number; duration_minutes?: number | null; inspector_id?: string | null; vendor_id?: string | null }, index: number) => ({
    order_id: order.id,
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

  if (servicesError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return serverError(servicesError.message, servicesError);
  }

  // Fetch complete order with relations
  const { data: completeOrder, error: fetchError } = await supabase
    .from("orders")
    .select(`
      *,
      property:properties(id, address_line1, address_line2, city, state, zip_code, property_type, year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool, basement, lot_size_acres, heating_type, cooling_type, roof_type, building_class, loading_docks, zoning, occupancy_type, ceiling_height, number_of_units, unit_mix, laundry_type, parking_spaces, elevator),
      client:clients(id, name, email, phone),
      agent:agents(id, name, email, phone),
      inspector:profiles(id, full_name, email),
      schedules:order_schedules(id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes),
      services:order_services(id, service_id, name, status, price, duration_minutes, template_id, sort_order, notes, inspector_id, vendor_id, inspector:profiles!inspection_services_inspector_id_fkey(id, full_name, email, avatar_url), vendor:vendors!inspection_services_vendor_id_fkey(id, name, vendor_type, email, phone))
    `)
    .eq("id", order.id)
    .single();

  if (fetchError) {
    return serverError(fetchError.message, fetchError);
  }

  try {
    triggerWebhookEvent("order.created", tenant.id, buildOrderCreatedPayload(completeOrder));
  } catch (error) {
    console.error("Failed to trigger webhook:", error);
  }

  return success(completeOrder);
});
