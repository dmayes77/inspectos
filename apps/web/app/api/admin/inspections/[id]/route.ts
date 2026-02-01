import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateInspectionSchema } from "@/lib/validations/inspection-api";
import { parseAddress } from "@/lib/utils/address";
import { format } from "date-fns";
import { assignInspectionLead, unassignInspectionRanks } from "../assignments";

const normalizeTime = (time?: string | null) => {
  if (!time) return "";
  return time.slice(0, 5);
};

const buildAddress = (property: { address_line1: string; city: string; state: string; zip_code: string }) =>
  `${property.address_line1}, ${property.city}, ${property.state} ${property.zip_code}`;

const mapStatusToDb = (status: string) => {
  if (status === "pending_report") return "submitted";
  if (status === "scheduled") return "draft";
  return status;
};

const mapOrderStatus = (status: string) => {
  switch (status) {
    case "in_progress":
      return "in_progress";
    case "completed":
    case "pending_report":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "scheduled";
  }
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

const unwrap = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: row, error } = await supabaseAdmin
    .from("inspections")
    .select(
      `
        id,
        status,
        notes,
        template_id,
        selected_type_ids,
        order:orders!inspections_order_id_fkey(
          id,
          status,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          property_id,
          client_id,
          inspector_id,
          property:properties(
            address_line1, city, state, zip_code, property_type, year_built, square_feet,
            bedrooms, bathrooms, stories, foundation, garage, pool,
            basement, lot_size_acres, heating_type, cooling_type, roof_type,
            building_class, loading_docks, zoning, occupancy_type, ceiling_height,
            number_of_units, unit_mix, laundry_type, parking_spaces, elevator
          ),
          client:clients(id, name),
          inspector:profiles(id, full_name)
        ),
        order_schedule:order_schedules!inspections_order_schedule_id_fkey(
          id,
          slot_date,
          slot_start,
          duration_minutes,
          status,
          service_id,
          package_id,
          inspector_id
        )
      `,
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "Inspection not found." }, { status: 404 });
  }

  const orderRelation = unwrap(row.order);
  if (!orderRelation) {
    return NextResponse.json({ error: "Inspection is not linked to an order." }, { status: 404 });
  }

  const scheduleRelation = unwrap(row.order_schedule);
  const orderClient = unwrap(orderRelation.client);
  const orderProperty = unwrap(orderRelation.property);
  const orderInspector = unwrap(orderRelation.inspector);

  const templateReference = row.template_id ?? "00000000-0000-0000-0000-000000000000";
  const selectedIds =
    Array.isArray(row.selected_type_ids) && row.selected_type_ids.length > 0
      ? row.selected_type_ids
      : scheduleRelation?.service_id
        ? [scheduleRelation.service_id]
        : [];

  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("tenant_id", tenantId)
    .eq("template_id", templateReference)
    .eq("is_active", true);

  const { data: selectedServices } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("tenant_id", tenantId)
    .in("id", selectedIds.length ? selectedIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_active", true);

  const { data: selectedPackages } = await supabaseAdmin
    .from("packages")
    .select("id, name, price, duration_minutes")
    .eq("tenant_id", tenantId)
    .in("id", selectedIds.length ? selectedIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_active", true);

  const selectedServiceMap = new Map<string, { id: string; price: number; duration: number }>();
  (selectedServices ?? []).forEach((service) => {
    selectedServiceMap.set(service.id, {
      id: service.id,
      price: Number(service.price ?? 0),
      duration: service.duration_minutes ?? 0,
    });
  });
  (selectedPackages ?? []).forEach((pkg) => {
    selectedServiceMap.set(pkg.id, {
      id: pkg.id,
      price: Number(pkg.price ?? 0),
      duration: pkg.duration_minutes ?? 0,
    });
  });

  const serviceList = (services ?? []).map((service) => ({
    id: service.id,
    price: Number(service.price ?? 0),
    duration: service.duration_minutes ?? 0,
  }));
  const selectedList = selectedIds.map((typeId) => selectedServiceMap.get(typeId)).filter(Boolean) as {
    id: string;
    price: number;
    duration: number;
  }[];
  const activeList = selectedList.length > 0 ? selectedList : serviceList;
  const price = activeList.reduce((sum, svc) => sum + svc.price, 0);
  const duration = activeList.reduce((sum, svc) => sum + svc.duration, 0) || orderRelation.duration_minutes || 0;

  const scheduledDate = scheduleRelation?.slot_date ?? orderRelation.scheduled_date ?? "";
  const scheduledTime = scheduleRelation?.slot_start ?? orderRelation.scheduled_time ?? null;
  const status = row.status === "submitted" ? "pending_report" : row.status === "draft" ? "scheduled" : row.status;

  return NextResponse.json({
    inspectionId: row.id,
    jobId: orderRelation.id,
    address: orderProperty ? buildAddress(orderProperty) : "",
    client: orderClient?.name ?? "",
    clientId: orderClient?.id ?? "",
    inspector: orderInspector?.full_name ?? "",
    inspectorId: orderInspector?.id ?? "",
    date: scheduledDate,
    time: normalizeTime(scheduledTime),
    types: selectedIds.length > 0 ? selectedIds : serviceList.map((svc) => svc.id),
    status,
    price,
    sqft: orderProperty?.square_feet ?? undefined,
    yearBuilt: orderProperty?.year_built ?? undefined,
    propertyType: orderProperty?.property_type ?? undefined,
    bedrooms: orderProperty?.bedrooms ?? undefined,
    bathrooms: orderProperty?.bathrooms ?? undefined,
    stories: orderProperty?.stories ?? undefined,
    foundation: orderProperty?.foundation ?? undefined,
    garage: orderProperty?.garage ?? undefined,
    pool: orderProperty?.pool ?? undefined,
    notes: row.notes ?? undefined,
    durationMinutes: duration,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;
  const validation = await validateRequestBody(request, updateInspectionSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data: inspection } = await supabaseAdmin
    .from("inspections")
    .select("id, order_id, order_schedule_id, template_id, selected_type_ids, status")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found." }, { status: 404 });
  }

  if (!inspection.order_id) {
    return NextResponse.json({ error: "Inspection is not linked to an order." }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, property_id, client_id, inspector_id, scheduled_date, scheduled_time, duration_minutes, status")
    .eq("tenant_id", tenantId)
    .eq("id", inspection.order_id)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Order not found for inspection." }, { status: 404 });
  }

  const incomingTypeIds = Array.isArray(payload.types) ? payload.types : undefined;
  let serviceRows: { id: string; template_id: string | null; duration_minutes: number | null; price: number | null; name: string | null }[] | null = [];
  let packageRows: { id: string; duration_minutes: number | null; price: number | null; name: string | null }[] | null = [];

  if (incomingTypeIds && incomingTypeIds.length > 0) {
    const [{ data: servicesData, error: servicesError }, { data: packagesData, error: packagesError }] = await Promise.all([
      supabaseAdmin.from("services").select("id, template_id, duration_minutes, price, name").eq("tenant_id", tenantId).in("id", incomingTypeIds),
      supabaseAdmin.from("packages").select("id, duration_minutes, price, name").eq("tenant_id", tenantId).in("id", incomingTypeIds),
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

  let templateId: string | null | undefined = inspection.template_id;
  let durationMinutes: number | undefined;
  if (incomingTypeIds && incomingTypeIds.length > 0) {
    templateId = serviceRows?.[0]?.template_id ?? templateId ?? null;
    if (!templateId) {
      const packageIds = (packageRows ?? []).map((pkg) => pkg.id);
      if (packageIds.length > 0) {
        const { data: packageItems } = await supabaseAdmin.from("package_items").select("service_id").in("package_id", packageIds);
        const serviceIds = (packageItems ?? []).map((item) => item.service_id);
        if (serviceIds.length > 0) {
          const { data: packageServices } = await supabaseAdmin.from("services").select("template_id").eq("tenant_id", tenantId).in("id", serviceIds);
          templateId = packageServices?.[0]?.template_id ?? templateId ?? null;
        }
      }
    }

    durationMinutes =
      (serviceRows?.reduce((sum, svc) => sum + (svc.duration_minutes ?? 0), 0) ?? 0) +
      (packageRows?.reduce((sum, pkg) => sum + (pkg.duration_minutes ?? 0), 0) ?? 0);
  }

  const propertyUpdate: {
    address_line1?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    property_type?: string | null;
    year_built?: number | null;
    square_feet?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    stories?: string | null;
    foundation?: string | null;
    garage?: string | null;
    pool?: boolean | null;
  } = {};

  if (payload.address !== undefined) {
    const addressParts = parseAddress(payload.address ?? "");
    if (addressParts.street) propertyUpdate.address_line1 = addressParts.street;
    if (addressParts.city) propertyUpdate.city = addressParts.city;
    if (addressParts.state) propertyUpdate.state = addressParts.state;
    if (addressParts.zip) propertyUpdate.zip_code = addressParts.zip;
  }
  if (payload.propertyType !== undefined) propertyUpdate.property_type = payload.propertyType ?? null;
  if (payload.yearBuilt !== undefined) propertyUpdate.year_built = payload.yearBuilt ?? null;
  if (payload.sqft !== undefined) propertyUpdate.square_feet = payload.sqft ?? null;
  if (payload.bedrooms !== undefined) propertyUpdate.bedrooms = payload.bedrooms ?? null;
  if (payload.bathrooms !== undefined) propertyUpdate.bathrooms = payload.bathrooms ?? null;
  if (payload.stories !== undefined) propertyUpdate.stories = payload.stories ?? null;
  if (payload.foundation !== undefined) propertyUpdate.foundation = payload.foundation ?? null;
  if (payload.garage !== undefined) propertyUpdate.garage = payload.garage ?? null;
  if (payload.pool !== undefined) propertyUpdate.pool = payload.pool ?? null;

  let propertyId = order.property_id;
  if (propertyId && Object.keys(propertyUpdate).length > 0) {
    await supabaseAdmin.from("properties").update(propertyUpdate).eq("tenant_id", tenantId).eq("id", propertyId);
    if (payload.clientId !== undefined) {
      await syncPropertyOwner(tenantId, propertyId, payload.clientId ?? null);
    }
  } else if (!propertyId && Object.keys(propertyUpdate).length > 0 && payload.address) {
    const addressParts = parseAddress(payload.address ?? "");
    const { data: newProperty, error: propertyError } = await supabaseAdmin
      .from("properties")
      .insert({
        tenant_id: tenantId,
        address_line1: addressParts.street || payload.address,
        city: addressParts.city || "Unknown",
        state: addressParts.state || "",
        zip_code: addressParts.zip || "00000",
        property_type: payload.propertyType ?? "single-family",
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

    if (propertyError || !newProperty) {
      return NextResponse.json({ error: propertyError?.message ?? "Failed to create property." }, { status: 500 });
    }
    propertyId = newProperty.id;
    await supabaseAdmin.from("orders").update({ property_id: propertyId }).eq("id", order.id);
    if (payload.clientId !== undefined) {
      await syncPropertyOwner(tenantId, propertyId, payload.clientId ?? null);
    }
  }

  const orderUpdate: Record<string, unknown> = {};
  if (payload.clientId !== undefined) orderUpdate.client_id = payload.clientId ?? null;
  if (payload.inspectorId !== undefined) orderUpdate.inspector_id = payload.inspectorId ?? null;
  if (payload.date !== undefined) orderUpdate.scheduled_date = payload.date;
  if (payload.time !== undefined) orderUpdate.scheduled_time = payload.time ?? null;
  if (durationMinutes !== undefined) orderUpdate.duration_minutes = durationMinutes || null;
  if (payload.status !== undefined) orderUpdate.status = mapOrderStatus(payload.status);
  if (payload.notes !== undefined) orderUpdate.internal_notes = payload.notes ?? null;
  if (propertyId && propertyId !== order.property_id) orderUpdate.property_id = propertyId;

  if (Object.keys(orderUpdate).length > 0) {
    const { error: orderUpdateError } = await supabaseAdmin.from("orders").update(orderUpdate).eq("id", order.id);
    if (orderUpdateError) {
      return NextResponse.json({ error: orderUpdateError.message }, { status: 500 });
    }
  }

  const scheduleSelect =
    "id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes";
  let primarySchedule = null;
  if (inspection.order_schedule_id) {
    const { data: existingSchedule } = await supabaseAdmin.from("order_schedules").select(scheduleSelect).eq("id", inspection.order_schedule_id).maybeSingle();
    primarySchedule = existingSchedule;
  }
  if (!primarySchedule) {
    const { data: scheduleLookup } = await supabaseAdmin
      .from("order_schedules")
      .select(scheduleSelect)
      .eq("order_id", order.id)
      .eq("schedule_type", "primary")
      .maybeSingle();
    primarySchedule = scheduleLookup;
  }

  const scheduleUpdate: Record<string, unknown> = {};
  if (payload.date !== undefined) scheduleUpdate.slot_date = payload.date;
  if (payload.time !== undefined) scheduleUpdate.slot_start = payload.time ?? null;
  if (durationMinutes !== undefined) scheduleUpdate.duration_minutes = durationMinutes || null;
  if (payload.inspectorId !== undefined) scheduleUpdate.inspector_id = payload.inspectorId ?? null;
  const finalOrderStatus = (orderUpdate.status as string | undefined) ?? order.status;
  if (payload.status !== undefined || payload.date !== undefined) {
    scheduleUpdate.status = mapOrderStatusToScheduleStatus(finalOrderStatus, (scheduleUpdate.slot_date as string | undefined) ?? order.scheduled_date ?? null);
  }

  if (incomingTypeIds && incomingTypeIds.length > 0) {
    const primaryServiceId = serviceRows?.[0]?.id ?? null;
    const primaryPackageId = primaryServiceId ? null : (packageRows?.[0]?.id ?? null);
    scheduleUpdate.service_id = primaryServiceId;
    scheduleUpdate.package_id = primaryPackageId;
  }

  let scheduleWasCreated = false;
  let scheduleWasUpdated = false;

  if (Object.keys(scheduleUpdate).length > 0) {
    if (primarySchedule) {
      const { data: updatedSchedule, error: scheduleError } = await supabaseAdmin
        .from("order_schedules")
        .update(scheduleUpdate)
        .eq("id", primarySchedule.id)
        .select(scheduleSelect)
        .single();
      if (scheduleError) {
        return NextResponse.json({ error: scheduleError.message }, { status: 500 });
      }
      primarySchedule = updatedSchedule;
      scheduleWasUpdated = true;
    } else {
      const { data: createdSchedule, error: scheduleError } = await supabaseAdmin
        .from("order_schedules")
        .insert({
          tenant_id: tenantId,
          order_id: order.id,
          schedule_type: "primary",
          label: "Primary Inspection",
          ...scheduleUpdate,
        })
        .select(scheduleSelect)
        .single();
      if (scheduleError || !createdSchedule) {
        return NextResponse.json({ error: scheduleError?.message ?? "Failed to update schedule." }, { status: 500 });
      }
      primarySchedule = createdSchedule;
      scheduleWasCreated = true;
    }

    // Trigger schedule webhooks
    if (primarySchedule && (scheduleWasCreated || scheduleWasUpdated)) {
      try {
        const { triggerWebhookEvent } = await import("@/lib/webhooks/delivery");
        const { buildSchedulePayload } = await import("@/lib/webhooks/payloads");

        // Fetch complete schedule data with inspector details
        const { data: completeSchedule } = await supabaseAdmin
          .from("order_schedules")
          .select(`
            id, order_id, schedule_type, label, slot_date, slot_start, slot_end,
            duration_minutes, status, created_at, updated_at,
            inspector:profiles(id, full_name, email)
          `)
          .eq("id", primarySchedule.id)
          .single();

        if (completeSchedule) {
          // Flatten inspector relation if it's an array
          const inspectorData = Array.isArray(completeSchedule.inspector)
            ? completeSchedule.inspector[0]
            : completeSchedule.inspector;

          const scheduleData = {
            ...completeSchedule,
            inspector: inspectorData || null
          };

          if (scheduleWasCreated) {
            triggerWebhookEvent("schedule.created", tenantId, buildSchedulePayload(scheduleData));
          } else if (scheduleWasUpdated) {
            triggerWebhookEvent("schedule.updated", tenantId, buildSchedulePayload(scheduleData));

            // Trigger schedule.cancelled if status changed to cancelled
            if (scheduleData.status === "cancelled") {
              triggerWebhookEvent("schedule.cancelled", tenantId, buildSchedulePayload(scheduleData));
            }
          }
        }
      } catch (error) {
        console.error("Failed to trigger schedule webhook:", error);
      }
    }
  }

  const inspectionUpdate: Record<string, unknown> = {};
  if (payload.status !== undefined) inspectionUpdate.status = mapStatusToDb(payload.status);
  if (payload.notes !== undefined) inspectionUpdate.notes = payload.notes ?? null;
  if (templateId !== undefined) inspectionUpdate.template_id = templateId;
  if (incomingTypeIds !== undefined) inspectionUpdate.selected_type_ids = incomingTypeIds;
  if (!inspection.order_schedule_id && primarySchedule?.id) {
    inspectionUpdate.order_schedule_id = primarySchedule.id;
  }

  if (Object.keys(inspectionUpdate).length > 0) {
    await supabaseAdmin.from("inspections").update(inspectionUpdate).eq("tenant_id", tenantId).eq("id", id);
  }

  if (incomingTypeIds) {
    await supabaseAdmin.from("inspection_services").delete().eq("inspection_id", id);
    if (incomingTypeIds.length > 0) {
      const serviceMap = new Map((serviceRows ?? []).map((svc) => [svc.id, svc]));
      const packageMap = new Map((packageRows ?? []).map((pkg) => [pkg.id, pkg]));
      const inspectionServicesPayload = incomingTypeIds
        .map((typeId, index) => {
          const svc = serviceMap.get(typeId);
          if (svc) {
            return {
              inspection_id: id,
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
              inspection_id: id,
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
  }

  if (payload.inspectorId !== undefined) {
    await unassignInspectionRanks(tenantId, id);
    if (payload.inspectorId) {
      await assignInspectionLead(tenantId, id, payload.inspectorId);
    }
  }

  // Trigger webhooks for inspection.updated and status-specific events
  try {
    const { triggerWebhookEvent } = await import("@/lib/webhooks/delivery");
    const { buildInspectionPayload } = await import("@/lib/webhooks/payloads");

    // Fetch complete inspection data for webhook payload
    const { data: completeInspection } = await supabaseAdmin
      .from("inspections")
      .select(`
        id, order_id, status, template_id, started_at, completed_at, submitted_at,
        created_at, updated_at,
        property:orders!inspections_order_id_fkey(properties(id, address_line1, address_line2, city, state, zip_code)),
        services:inspection_services(id, name, status, price)
      `)
      .eq("id", id)
      .single();

    if (completeInspection) {
      // Flatten the property relation
      const propertyData = Array.isArray(completeInspection.property)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (completeInspection.property[0] as any)?.properties
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (completeInspection.property as any)?.properties;

      const inspectionData = {
        ...completeInspection,
        property: propertyData || null
      };

      // Always trigger inspection.updated
      triggerWebhookEvent("inspection.updated", tenantId, buildInspectionPayload(inspectionData));

      // Trigger status-specific events when status changes
      const previousStatus = inspection.status;
      const newStatus = mapStatusToDb(payload.status ?? "");

      if (payload.status !== undefined && newStatus !== previousStatus) {
        if (newStatus === "in_progress" && previousStatus !== "in_progress") {
          triggerWebhookEvent("inspection.started", tenantId, buildInspectionPayload(inspectionData));
        }
        if (newStatus === "completed" && previousStatus !== "completed") {
          triggerWebhookEvent("inspection.completed", tenantId, buildInspectionPayload(inspectionData));
        }
        if (newStatus === "submitted" && previousStatus !== "submitted") {
          triggerWebhookEvent("inspection.submitted", tenantId, buildInspectionPayload(inspectionData));
        }
      }
    }
  } catch (error) {
    console.error("Failed to trigger webhook:", error);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: inspection } = await supabaseAdmin.from("inspections").select("id").eq("tenant_id", tenantId).eq("id", id).maybeSingle();

  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found." }, { status: 404 });
  }

  await supabaseAdmin.from("inspection_services").delete().eq("inspection_id", id);
  await supabaseAdmin.from("inspections").delete().eq("tenant_id", tenantId).eq("id", id);

  return NextResponse.json({ success: true });
}

async function syncPropertyOwner(tenantId: string, propertyId: string, clientId: string | null) {
  const ownerDate = format(new Date(), "yyyy-MM-dd");
  await supabaseAdmin
    .from("property_owners")
    .update({ end_date: ownerDate, is_primary: false })
    .eq("tenant_id", tenantId)
    .eq("property_id", propertyId)
    .is("end_date", null);

  if (clientId) {
    await supabaseAdmin.from("property_owners").insert({
      tenant_id: tenantId,
      property_id: propertyId,
      client_id: clientId,
      start_date: ownerDate,
      is_primary: true,
    });
  }
}
