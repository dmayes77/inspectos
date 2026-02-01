import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createInspectionSchema } from "@/lib/validations/inspection-api";
import { parseAddress } from "@/lib/utils/address";
import { assignInspectionLead } from "./assignments";

type Relational<T> = T | T[] | null;

type ClientSummary = {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
};

type PropertySummary = {
  id?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  property_type?: string | null;
  year_built?: number | null;
  square_feet?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  stories?: number | null;
  foundation?: string | null;
  garage?: string | null;
  pool?: string | null;
  basement?: string | null;
  lot_size_acres?: number | null;
  heating_type?: string | null;
  cooling_type?: string | null;
  building_class?: string | null;
  loading_docks?: string | null;
  roof_type?: string | null;
  zoning?: string | null;
  occupancy_type?: string | null;
  ceiling_height?: string | null;
  number_of_units?: number | null;
  unit_mix?: string | null;
  laundry_type?: string | null;
  parking_spaces?: number | null;
  elevator?: string | null;
};

type InspectorSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type InspectionRow = {
  id: string;
  created_at: string | null;
  status: string;
  notes: string | null;
  selected_type_ids?: string[] | null;
  order: Relational<OrderRelation>;
  order_schedule: Relational<OrderScheduleRelation>;
};

type OrderRelation = {
  id: string;
  order_number?: string | null;
  status: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  template_id?: string | null;
  selected_service_ids?: string[] | null;
  client?: Relational<ClientSummary>;
  property?: Relational<PropertySummary>;
  inspector?: Relational<InspectorSummary>;
  total?: number | null;
  payment_status?: string | null;
};

type OrderScheduleRelation = {
  id: string;
  tenant_id: string;
  order_id: string;
  schedule_type: string;
  label: string | null;
  service_id: string | null;
  package_id: string | null;
  inspector_id: string | null;
  slot_date: string | null;
  slot_start: string | null;
  slot_end: string | null;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
};

const ALLOWED_PROPERTY_TYPES = new Set(["single-family", "condo-townhome", "multi-family", "manufactured", "commercial"]);

const normalizePropertyType = (value?: string | null) => {
  if (!value) return "single-family";
  return ALLOWED_PROPERTY_TYPES.has(value) ? value : "single-family";
};

const normalizeTime = (time?: string | null) => {
  if (!time) return "";
  return time.slice(0, 5);
};

const unwrap = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

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

export async function GET(request: Request) {
  // ...existing code...

  // ...existing code...
  const url = new URL(request.url);
  const tenantParam = url.searchParams.get("tenant");
  const tenantId = tenantParam || getTenantId();
  const debug = url.searchParams.get("debug") === "1";

  if (debug) {
    const [inspectionsCount, ordersCount] = await Promise.all([
      supabaseAdmin.from("inspections").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    ]);

    return NextResponse.json({
      tenantId,
      counts: {
        inspections: inspectionsCount.count ?? 0,
        orders: ordersCount.count ?? 0,
      },
      errors: {
        inspections: inspectionsCount.error?.message ?? null,
        orders: ordersCount.error?.message ?? null,
      },
    });
  }

  if (url.searchParams.get("debug") === "2") {
    const { data: raw, error: rawError } = await supabaseAdmin
      .from("inspections")
      .select(
        `
          id,
          status,
          notes,
          selected_type_ids,
          order:orders!inspections_order_id_fkey(
            id,
            status,
            scheduled_date,
            scheduled_time,
            duration_minutes,
            client:clients(id, name, email, phone, company),
            property:properties(
              address_line1, city, state, zip_code, property_type, year_built, square_feet,
              bedrooms, bathrooms, stories, foundation, garage, pool,
              basement, lot_size_acres, heating_type, cooling_type, roof_type,
              building_class, loading_docks, zoning, occupancy_type, ceiling_height,
              number_of_units, unit_mix, laundry_type, parking_spaces, elevator
            ),
            inspector:profiles(id, full_name, email, avatar_url)
          )
        `,
      )
      .eq("tenant_id", tenantId)
      .limit(3);

    console.log("[Inspections API] debug sample", { tenantId, error: rawError?.message ?? null, count: raw?.length ?? 0 });
    return NextResponse.json({ tenantId, error: rawError?.message ?? null, sample: raw ?? [] });
  }
  const { data: inspections, error } = await supabaseAdmin
    .from("inspections")
    .select(
      `
        id,
        created_at,
        status,
        notes,
        selected_type_ids,
        order:orders!inspections_order_id_fkey(
          id,
          order_number,
          total,
          payment_status,
          status,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          client:clients(id, name, email, phone, company),
          property:properties(
            address_line1, city, state, zip_code, property_type, year_built, square_feet,
            bedrooms, bathrooms, stories, foundation, garage, pool,
            basement, lot_size_acres, heating_type, cooling_type, roof_type,
            building_class, loading_docks, zoning, occupancy_type, ceiling_height,
            number_of_units, unit_mix, laundry_type, parking_spaces, elevator
          )
        ),
        order_schedule:order_schedules!inspections_order_schedule_id_fkey(
          id,
          tenant_id,
          order_id,
          schedule_type,
          label,
          service_id,
          package_id,
          inspector_id,
          slot_date,
          slot_start,
          slot_end,
          duration_minutes,
          status,
          notes
        )
      `,
    )
    .eq("tenant_id", tenantId);

  console.log("[Inspections API] fetch", {
    tenantId,
    url: request.url,
    resultCount: Array.isArray(inspections) ? inspections.length : 0,
    error: error?.message ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = Array.isArray(inspections) ? (inspections as unknown as InspectionRow[]) : [];
  // After inspections are fetched, get assigned vendors for those inspections
  const inspectionIds = rows.map((i: any) => i.id);
  const { data: inspectionVendors, error: vendorError } = await supabaseAdmin
    .from("inspection_vendors")
    .select("inspection_id, vendor_id, vendor:vendors(*)")
    .in("inspection_id", inspectionIds);

  // Map inspection_id to vendors
  const vendorMap: Record<string, any[]> = {};
  if (Array.isArray(inspectionVendors)) {
    for (const iv of inspectionVendors) {
      if (!vendorMap[iv.inspection_id]) vendorMap[iv.inspection_id] = [];
      vendorMap[iv.inspection_id].push(iv.vendor);
    }
  }
  const mapped = rows.map((row) => {
    const orderRelation = unwrap(row.order);
    const scheduleRelation = unwrap(row.order_schedule);

    const orderClient = unwrap(orderRelation?.client);
    const orderProperty = unwrap(orderRelation?.property);
    const orderInspector = unwrap(orderRelation?.inspector);

    const property = orderProperty ?? null;
    const client = orderClient ?? null;
    const inspector = orderInspector ?? null;
    const selectedServiceIds = scheduleRelation?.service_id
      ? [scheduleRelation.service_id]
      : Array.isArray((orderRelation as { selected_service_ids?: string[] | null } | null)?.selected_service_ids)
        ? ((orderRelation as { selected_service_ids?: string[] | null })?.selected_service_ids ?? [])
        : Array.isArray(row.selected_type_ids)
          ? row.selected_type_ids
          : [];

    const scheduledDate = orderRelation?.scheduled_date ?? scheduleRelation?.slot_date ?? null;
    const scheduledTime = orderRelation?.scheduled_time ?? scheduleRelation?.slot_start ?? null;
    const durationMinutes = orderRelation?.duration_minutes ?? scheduleRelation?.duration_minutes ?? null;

    const normalizedJob = orderRelation
      ? {
          ...orderRelation,
          client: orderClient,
          property: orderProperty,
          inspector: orderInspector,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime ? normalizeTime(scheduledTime) : null,
          duration_minutes: durationMinutes,
          selected_service_ids: selectedServiceIds,
        }
      : null;

    const status = row.status === "submitted" ? "pending_report" : row.status === "draft" ? "scheduled" : row.status;

    return {
      id: row.id,
      created_at: row.created_at ?? null,
      status,
      notes: row.notes,
      inspector: inspector ?? null,
      job: normalizedJob,
      schedule: scheduleRelation ?? null,
      vendors: vendorMap[row.id] ?? [],
      vendorIds: Array.isArray(vendorMap[row.id]) ? vendorMap[row.id].map((v) => v?.id).filter(Boolean) : [],
      summary: {
        property,
        client,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime ? normalizeTime(scheduledTime) : null,
        duration_minutes: durationMinutes,
        service_ids: selectedServiceIds,
        order_number: orderRelation?.order_number ?? null,
        total: orderRelation?.total ?? null,
        payment_status: orderRelation?.payment_status ?? null,
      },
    };
  });

  return NextResponse.json({ tenantId, data: mapped });
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createInspectionSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;
  const orderId = payload.orderId?.trim();
  let linkedOrder:
    | (Pick<
        {
          property_id: string | null;
          client_id: string | null;
          inspector_id: string | null;
          scheduled_date: string | null;
          scheduled_time: string | null;
          duration_minutes: number | null;
          status: string | null;
        },
        "property_id" | "client_id" | "inspector_id" | "scheduled_date" | "scheduled_time" | "duration_minutes" | "status"
      > & { id: string })
    | null = null;

  if (orderId) {
    const { data: orderRow, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, property_id, client_id, inspector_id, scheduled_date, scheduled_time, duration_minutes, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!orderRow) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    linkedOrder = orderRow;
  }

  const selectedTypeIds = Array.isArray(payload.types) ? payload.types : [];

  let serviceRows: { id: string; template_id: string | null; duration_minutes: number | null; price: number | null; name: string | null }[] | null = [];
  let packageRows: { id: string; duration_minutes: number | null; price: number | null; name: string | null }[] | null = [];

  if (selectedTypeIds.length > 0) {
    const [{ data: servicesData, error: servicesError }, { data: packagesData, error: packagesError }] = await Promise.all([
      supabaseAdmin.from("services").select("id, template_id, duration_minutes, price, name").eq("tenant_id", tenantId).in("id", selectedTypeIds),
      supabaseAdmin.from("packages").select("id, duration_minutes, price, name").eq("tenant_id", tenantId).in("id", selectedTypeIds),
    ]);

    if (servicesError) {
      return NextResponse.json({ error: servicesError.message }, { status: 500 });
    }
    if (packagesError) {
      return NextResponse.json({ error: packagesError.message }, { status: 500 });
    }

    serviceRows = servicesData ?? [];
    packageRows = packagesData ?? [];
  }

  let templateId = serviceRows?.[0]?.template_id ?? null;
  if (!templateId) {
    const packageIds = (packageRows ?? []).map((pkg) => pkg.id);
    if (packageIds.length > 0) {
      const { data: packageItems } = await supabaseAdmin.from("package_items").select("service_id").in("package_id", packageIds);
      const serviceIds = (packageItems ?? []).map((item) => item.service_id);
      if (serviceIds.length > 0) {
        const { data: packageServices } = await supabaseAdmin.from("services").select("template_id").eq("tenant_id", tenantId).in("id", serviceIds);
        templateId = packageServices?.[0]?.template_id ?? null;
      }
    }
  }

  const durationMinutes =
    (serviceRows?.reduce((sum, svc) => sum + (svc.duration_minutes ?? 0), 0) ?? 0) +
    (packageRows?.reduce((sum, pkg) => sum + (pkg.duration_minutes ?? 0), 0) ?? 0);
  const subtotal =
    (serviceRows?.reduce((sum, svc) => sum + Number(svc.price ?? 0), 0) ?? 0) + (packageRows?.reduce((sum, pkg) => sum + Number(pkg.price ?? 0), 0) ?? 0);

  const { street, city, state, zip } = parseAddress(payload.address ?? "");
  const { data: existingProperty } = await supabaseAdmin
    .from("properties")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("address_line1", street)
    .eq("city", city)
    .eq("state", state)
    .eq("zip_code", zip || "00000")
    .maybeSingle();

  let propertyId = linkedOrder?.property_id ?? existingProperty?.id ?? null;
  if (!propertyId) {
    const propertyType = normalizePropertyType(payload.propertyType);
    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .insert({
        tenant_id: tenantId,
        address_line1: street,
        city,
        state,
        zip_code: zip || "00000",
        property_type: propertyType,
        year_built: payload.yearBuilt ?? null,
        square_feet: payload.sqft ?? null,
        bedrooms: payload.bedrooms ?? null,
        bathrooms: payload.bathrooms ?? null,
        stories: payload.stories ?? null,
        foundation: payload.foundation ?? null,
        garage: payload.garage ?? null,
        pool: payload.pool ?? null,
      })
      .select("id")
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: propertyError?.message ?? "Failed to create property." }, { status: 500 });
    }
    propertyId = property.id;
  }

  const effectiveClientId = payload.clientId ?? linkedOrder?.client_id ?? null;
  const effectiveInspectorId = payload.inspectorId ?? linkedOrder?.inspector_id ?? null;
  const scheduledDate = payload.date ?? linkedOrder?.scheduled_date ?? null;
  const scheduledTime = payload.time ?? linkedOrder?.scheduled_time ?? null;
  const appointmentDuration = durationMinutes || linkedOrder?.duration_minutes || 120;

  if (!propertyId) {
    return NextResponse.json({ error: "Property could not be resolved for this inspection." }, { status: 400 });
  }

  if (!linkedOrder) {
    const orderStatus = scheduledDate && effectiveInspectorId ? "scheduled" : "pending";
    const { data: createdOrder, error: orderInsertError } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: tenantId,
        client_id: effectiveClientId,
        inspector_id: effectiveInspectorId,
        property_id: propertyId,
        status: orderStatus,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime ?? null,
        duration_minutes: appointmentDuration,
        subtotal,
        total: subtotal,
        source: "admin_inspections_api",
        internal_notes: payload.notes ?? null,
      })
      .select("id, property_id, client_id, inspector_id, scheduled_date, scheduled_time, duration_minutes, status")
      .single();

    if (orderInsertError || !createdOrder) {
      return NextResponse.json({ error: orderInsertError?.message ?? "Failed to create order." }, { status: 500 });
    }
    linkedOrder = createdOrder;
  }

  const orderStatusForSchedule = linkedOrder.status ?? null;

  const getPrimarySchedule = () =>
    supabaseAdmin
      .from("order_schedules")
      .select(
        "id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes",
      )
      .eq("order_id", linkedOrder!.id)
      .eq("schedule_type", "primary")
      .maybeSingle();

  let { data: existingSchedule, error: scheduleLookupError } = orderId ? await getPrimarySchedule() : { data: null, error: null };
  if (scheduleLookupError) {
    return NextResponse.json({ error: scheduleLookupError.message }, { status: 500 });
  }

  const primaryServiceId = serviceRows?.[0]?.id ?? null;
  const primaryPackageId = primaryServiceId ? null : (packageRows?.[0]?.id ?? null);
  const schedulePayload = {
    slot_date: scheduledDate ?? linkedOrder.scheduled_date ?? null,
    slot_start: scheduledTime ?? linkedOrder.scheduled_time ?? null,
    duration_minutes: appointmentDuration,
    inspector_id: effectiveInspectorId ?? linkedOrder.inspector_id ?? null,
    status: mapOrderStatusToScheduleStatus(orderStatusForSchedule, scheduledDate ?? linkedOrder.scheduled_date ?? null),
    service_id: primaryServiceId,
    package_id: primaryPackageId,
  };

  const scheduleSelectColumns =
    "id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes";

  let primarySchedule = existingSchedule;
  if (existingSchedule) {
    const { data: updatedSchedule, error: scheduleUpdateError } = await supabaseAdmin
      .from("order_schedules")
      .update({ ...schedulePayload, label: existingSchedule.label ?? "Primary Inspection" })
      .eq("id", existingSchedule.id)
      .select(scheduleSelectColumns)
      .single();

    if (scheduleUpdateError) {
      return NextResponse.json({ error: scheduleUpdateError.message }, { status: 500 });
    }
    primarySchedule = updatedSchedule ?? existingSchedule;
  } else {
    const { data: createdSchedule, error: scheduleInsertError } = await supabaseAdmin
      .from("order_schedules")
      .insert({
        tenant_id: tenantId,
        order_id: linkedOrder.id,
        schedule_type: "primary",
        label: "Primary Inspection",
        notes: payload.notes ?? null,
        slot_end: null,
        ...schedulePayload,
      })
      .select(scheduleSelectColumns)
      .single();

    if (scheduleInsertError || !createdSchedule) {
      return NextResponse.json({ error: scheduleInsertError?.message ?? "Failed to create schedule." }, { status: 500 });
    }
    primarySchedule = createdSchedule;
  }

  const { data: inspection, error: inspectionError } = await supabaseAdmin
    .from("inspections")
    .insert({
      tenant_id: tenantId,
      order_id: linkedOrder.id,
      order_schedule_id: primarySchedule?.id ?? null,
      template_id: templateId,
      template_version: 1,
      status: "draft",
      notes: payload.notes ?? null,
      selected_type_ids: selectedTypeIds,
    })
    .select("id")
    .single();

  if (inspectionError || !inspection) {
    return NextResponse.json({ error: inspectionError?.message ?? "Failed to create inspection." }, { status: 500 });
  }

  if (selectedTypeIds.length > 0) {
    const serviceMap = new Map((serviceRows ?? []).map((svc) => [svc.id, svc]));
    const packageMap = new Map((packageRows ?? []).map((pkg) => [pkg.id, pkg]));
    const inspectionServicesPayload = selectedTypeIds
      .map((typeId, index) => {
        const svc = serviceMap.get(typeId);
        if (svc) {
          return {
            inspection_id: inspection.id,
            service_id: svc.id,
            template_id: svc.template_id ?? templateId,
            name: svc.name ?? "Service",
            price: Number(svc.price ?? 0),
            duration_minutes: svc.duration_minutes ?? null,
            status: "pending" as const,
            sort_order: index,
          };
        }
        const pkg = packageMap.get(typeId);
        if (pkg) {
          return {
            inspection_id: inspection.id,
            service_id: null,
            template_id: templateId,
            name: pkg.name ?? "Package",
            price: Number(pkg.price ?? 0),
            duration_minutes: pkg.duration_minutes ?? null,
            status: "pending" as const,
            sort_order: index,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (inspectionServicesPayload.length > 0) {
      const { error: servicesError } = await supabaseAdmin.from("inspection_services").insert(inspectionServicesPayload as Record<string, unknown>[]);
      if (servicesError) {
        return NextResponse.json({ error: servicesError.message }, { status: 500 });
      }
    }
  }

  if (effectiveInspectorId) {
    await assignInspectionLead(tenantId, inspection.id, effectiveInspectorId);
  }

  const scheduleDate = primarySchedule?.slot_date ?? scheduledDate;
  const scheduleTime = primarySchedule?.slot_start ?? scheduledTime;
  const scheduleDuration = primarySchedule?.duration_minutes ?? appointmentDuration;

  if (effectiveInspectorId && scheduleDate) {
    const startTime = scheduleTime ? scheduleTime : "09:00";
    const startsAt = new Date(`${scheduleDate}T${startTime}:00`);
    const endsAt = new Date(startsAt.getTime() + (scheduleDuration ?? 120) * 60_000);
    await supabaseAdmin.from("schedule_blocks").insert({
      tenant_id: tenantId,
      inspector_id: effectiveInspectorId,
      inspection_id: inspection.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "scheduled",
    });
  }

  return NextResponse.json({ inspectionId: inspection.id });
}
