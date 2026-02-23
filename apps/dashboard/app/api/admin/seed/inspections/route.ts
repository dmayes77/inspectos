import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
// TODO: Restore inspection lead assignment after inspections migration
// import { assignInspectionLead } from "@/app/api/admin/inspections/assignments";

type ServiceRow = {
  id: string;
  name: string | null;
  template_id: string | null;
  duration_minutes: number | null;
  price: number | null;
  is_active: boolean | null;
};

type PropertyRow = {
  id: string;
  client_id: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
};

type ClientRow = {
  id: string;
  name: string | null;
};

type TenantMemberRow = {
  user_id: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type OrderRow = {
  property_id: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string | null;
};

type InspectionRow = {
  status: string | null;
};

type TemplateRow = {
  id: string;
};

const MAX_INSPECTIONS_TO_SEED = 10;
const ORDER_STATUS_FALLBACK = ["scheduled", "in_progress", "pending_report", "completed"] as const;
const INSPECTION_STATUS_FALLBACK = ["draft", "in_progress", "submitted", "completed"] as const;
const FALLBACK_TIMES = ["09:00", "10:30", "12:30", "14:00", "15:30"] as const;

const parseISODate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const computeBaseDate = (orders: OrderRow[]) => {
  const parsedDates = orders.map((order) => parseISODate(order.scheduled_date)).filter((date): date is Date => Boolean(date));

  if (!parsedDates.length) {
    return new Date();
  }

  parsedDates.sort((a, b) => a.getTime() - b.getTime());
  return parsedDates[parsedDates.length - 1]!;
};

const computeFutureDate = (baseDate: Date, offsetDays: number) => {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + offsetDays + 1);
  return next.toISOString().slice(0, 10);
};

const buildTimePool = (orders: OrderRow[]) => {
  const times = Array.from(new Set(orders.map((order) => order.scheduled_time).filter((time): time is string => Boolean(time))));
  return times.length ? times : [...FALLBACK_TIMES];
};

const buildStatusPool = (values: (string | null | undefined)[], fallback: readonly string[]) => {
  const unique = Array.from(new Set(values.filter((value): value is string => Boolean(value))));
  return unique.length ? unique : [...fallback];
};

const pickServices = (services: ServiceRow[], iteration: number) => {
  if (!services.length) return [] as ServiceRow[];
  const subsetSize = Math.min(services.length, 3);
  const selection: ServiceRow[] = [];
  for (let i = 0; i < subsetSize; i += 1) {
    const svc = services[(iteration + i) % services.length];
    if (svc) {
      selection.push(svc);
    }
  }
  return Array.from(new Map(selection.map((svc) => [svc.id, svc])).values());
};

const formatPropertyLabel = (property: PropertyRow) => {
  return [property.address_line1, property.city, property.state].filter(Boolean).join(", ");
};

export async function POST() {
  const tenantId = getTenantId();

  const [clientsResult, propertiesResult, servicesResult, tenantMembersResult, ordersResult, inspectionsResult, templatesResult] = await Promise.all([
    supabaseAdmin.from("clients").select("id, name").eq("tenant_id", tenantId),
    supabaseAdmin.from("properties").select("id, client_id, address_line1, city, state, zip_code, notes").eq("tenant_id", tenantId),
    supabaseAdmin.from("services").select("id, name, template_id, duration_minutes, price, is_active").eq("tenant_id", tenantId).eq("is_active", true),
    supabaseAdmin.from("tenant_members").select("user_id").eq("tenant_id", tenantId).eq("role", "inspector"),
    supabaseAdmin.from("orders").select("property_id, scheduled_date, scheduled_time, status").eq("tenant_id", tenantId),
    supabaseAdmin.from("inspections").select("status").eq("tenant_id", tenantId),
    supabaseAdmin.from("templates").select("id").eq("tenant_id", tenantId).eq("is_active", true),
  ]);

  const firstError =
    clientsResult.error ||
    propertiesResult.error ||
    servicesResult.error ||
    tenantMembersResult.error ||
    ordersResult.error ||
    inspectionsResult.error ||
    templatesResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const clients = (clientsResult.data ?? []) as ClientRow[];
  const properties = ((propertiesResult.data ?? []) as PropertyRow[]).filter((property) => Boolean(property.client_id));
  const services = ((servicesResult.data ?? []) as ServiceRow[]).filter((service) => service.is_active !== false);
  const tenantInspectors = (tenantMembersResult.data ?? []) as TenantMemberRow[];
  const existingOrders = (ordersResult.data ?? []) as OrderRow[];
  const existingInspections = (inspectionsResult.data ?? []) as InspectionRow[];
  const templates = (templatesResult.data ?? []) as TemplateRow[];

  if (!clients.length) {
    return NextResponse.json({ error: "No clients found for this tenant." }, { status: 400 });
  }

  if (!properties.length) {
    return NextResponse.json({ error: "No properties available for seeding." }, { status: 400 });
  }

  if (!services.length) {
    return NextResponse.json({ error: "No active services exist. Seed services before inspections." }, { status: 400 });
  }

  if (!tenantInspectors.length) {
    return NextResponse.json({ error: "At least one inspector is required before seeding inspections." }, { status: 400 });
  }

  const inspectorIds = tenantInspectors.map((member) => member.user_id).filter(Boolean);

  const { data: inspectorProfiles, error: profilesError } = inspectorIds.length
    ? await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", inspectorIds)
    : { data: [], error: null };

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const inspectors = inspectorIds
    .map((id) => {
      const profile = (inspectorProfiles ?? []) as ProfileRow[];
      const match = profile.find((item) => item.id === id);
      return {
        id,
        name: match?.full_name ?? "Inspector",
      };
    })
    .filter((inspector) => Boolean(inspector.id));

  if (!inspectors.length) {
    return NextResponse.json({ error: "Unable to resolve inspector profiles." }, { status: 400 });
  }

  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const propertiesWithClients = properties.filter((property) => property.client_id && clientsById.has(property.client_id));

  if (!propertiesWithClients.length) {
    return NextResponse.json({ error: "No properties linked to existing clients." }, { status: 400 });
  }

  const fallbackTemplateId = templates[0]?.id ?? null;
  if (!services.some((service) => service.template_id) && !fallbackTemplateId) {
    return NextResponse.json({ error: "No templates found for selected services. Seed templates first." }, { status: 400 });
  }

  const orderKeys = new Set(existingOrders.map((order) => `${order.property_id}|${order.scheduled_date}|${order.scheduled_time ?? ""}`));
  const propertyUsage = new Map<string, number>();

  const baseDate = computeBaseDate(existingOrders);
  const scheduleTimes = buildTimePool(existingOrders);
  const orderStatusPool = buildStatusPool(
    existingOrders.map((order) => order.status),
    ORDER_STATUS_FALLBACK,
  );
  const inspectionStatusPool = buildStatusPool(
    existingInspections.map((inspection) => inspection.status),
    INSPECTION_STATUS_FALLBACK,
  );

  let createdOrders = 0;
  let createdSchedules = 0;
  let createdInspections = 0;
  const createdInspectionIds: string[] = [];

  const queue = propertiesWithClients.slice(0, Math.min(propertiesWithClients.length, MAX_INSPECTIONS_TO_SEED * 2));

  for (const property of queue) {
    if (createdInspections >= MAX_INSPECTIONS_TO_SEED) {
      break;
    }

    const clientId = property.client_id!;
    const currentUsage = propertyUsage.get(property.id) ?? 0;
    if (currentUsage >= 2) {
      continue;
    }

    const servicesForInspection = pickServices(services, createdInspections + currentUsage);
    if (!servicesForInspection.length) {
      continue;
    }

    const templateId = servicesForInspection.find((svc) => svc.template_id)?.template_id ?? fallbackTemplateId;
    if (!templateId) {
      continue;
    }

    const inspector = inspectors[createdInspections % inspectors.length];
    const scheduledDate = computeFutureDate(baseDate, createdInspections + currentUsage);
    const scheduledTime = scheduleTimes[(createdInspections + currentUsage) % scheduleTimes.length] ?? null;
    const orderKey = `${property.id}|${scheduledDate}|${scheduledTime ?? ""}`;
    if (orderKeys.has(orderKey)) {
      continue;
    }

    const selectedTypeIds = servicesForInspection.map((svc) => svc.id);
    const computedDurationMinutes = Math.max(
      servicesForInspection.reduce((sum, svc) => sum + (svc.duration_minutes ?? 0), 0),
      60,
    );
    const subtotal = Math.max(
      servicesForInspection.reduce((sum, svc) => sum + Number(svc.price ?? 0), 0),
      150,
    );
    const propertyLabel = formatPropertyLabel(property);
    const note = property.notes ?? (propertyLabel ? `Auto-generated for ${propertyLabel}` : null);
    const orderStatus = orderStatusPool[createdInspections % orderStatusPool.length];
    const inspectionStatus = inspectionStatusPool[createdInspections % inspectionStatusPool.length];

    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: tenantId,
        property_id: property.id,
        client_id: clientId,
        inspector_id: inspector.id,
        status: orderStatus,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: computedDurationMinutes,
        subtotal,
        total: subtotal,
        source: "seed_from_db",
        internal_notes: note,
        selected_service_ids: selectedTypeIds,
      })
      .select("id")
      .single();

    if (orderError || !createdOrder) {
      return NextResponse.json({ error: orderError?.message ?? "Failed to create order." }, { status: 500 });
    }

    createdOrders += 1;
    orderKeys.add(orderKey);
    propertyUsage.set(property.id, currentUsage + 1);

    const { data: createdSchedule, error: scheduleError } = await supabaseAdmin
      .from("order_schedules")
      .insert({
        tenant_id: tenantId,
        order_id: createdOrder.id,
        schedule_type: "primary",
        label: `Inspection for ${clientsById.get(clientId)?.name ?? "Client"}`,
        service_id: selectedTypeIds[0] ?? null,
        package_id: null,
        inspector_id: inspector.id,
        slot_date: scheduledDate,
        slot_start: scheduledTime,
        slot_end: null,
        duration_minutes: computedDurationMinutes,
        status: orderStatus,
        notes: note,
      })
      .select("id")
      .single();

    if (scheduleError || !createdSchedule) {
      return NextResponse.json({ error: scheduleError?.message ?? "Failed to create schedule." }, { status: 500 });
    }

    createdSchedules += 1;

    const { data: createdInspection, error: inspectionError } = await supabaseAdmin
      .from("inspections")
      .insert({
        tenant_id: tenantId,
        order_id: createdOrder.id,
        order_schedule_id: createdSchedule.id,
        template_id: templateId,
        template_version: 1,
        status: inspectionStatus,
        notes: note,
        selected_type_ids: selectedTypeIds,
      })
      .select("id")
      .single();

    if (inspectionError || !createdInspection) {
      return NextResponse.json({ error: inspectionError?.message ?? "Failed to create inspection." }, { status: 500 });
    }

    createdInspections += 1;
    createdInspectionIds.push(createdInspection.id);

    if (selectedTypeIds.length > 0) {
      const inspectionServicesPayload = servicesForInspection.map((svc, index) => ({
        inspection_id: createdInspection.id,
        service_id: svc.id,
        template_id: svc.template_id ?? templateId,
        name: svc.name ?? "Service",
        price: Number(svc.price ?? 0),
        duration_minutes: svc.duration_minutes ?? null,
        status: "pending" as const,
        sort_order: index,
      }));

      const { error: servicesInsertError } = await supabaseAdmin.from("inspection_services").insert(inspectionServicesPayload);
      if (servicesInsertError) {
        return NextResponse.json({ error: servicesInsertError.message }, { status: 500 });
      }
    }

    // TODO: Restore inspection lead assignment after inspections migration
    // await assignInspectionLead(tenantId, createdInspection.id, inspector.id);
  }

  if (!createdInspections) {
    return NextResponse.json({ message: "No new inspections were seeded. Check for available properties or duplicate schedules." }, { status: 200 });
  }

  return NextResponse.json({
    message: "Seeded inspections using existing tenant data.",
    ordersCreated: createdOrders,
    schedulesCreated: createdSchedules,
    inspectionsCreated: createdInspections,
    inspectionIds: createdInspectionIds,
  });
}
