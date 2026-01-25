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
};

type PropertySummary = {
  address_line1?: string | null;
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
  roof_type?: string | null;
  building_class?: string | null;
  loading_docks?: string | null;
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

type JobRelation = {
  id: string;
  status: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  template_id?: string | null;
  selected_service_ids?: string[] | null;
  client?: Relational<ClientSummary>;
  property?: Relational<PropertySummary>;
  inspector?: Relational<InspectorSummary>;
};

type InspectionRow = {
  id: string;
  status: string;
  notes: string | null;
  job: Relational<JobRelation>;
  order: Relational<JobRelation>;
};

const normalizeTime = (time?: string | null) => {
  if (!time) return "";
  return time.slice(0, 5);
};

const unwrap = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantParam = url.searchParams.get("tenant");
  const tenantId = tenantParam || getTenantId();
  const debug = url.searchParams.get("debug") === "1";

  if (debug) {
    const [inspectionsCount, jobsCount, ordersCount] = await Promise.all([
      supabaseAdmin.from("inspections").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabaseAdmin.from("jobs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    ]);

    return NextResponse.json({
      tenantId,
      counts: {
        inspections: inspectionsCount.count ?? 0,
        jobs: jobsCount.count ?? 0,
        orders: ordersCount.count ?? 0,
      },
      errors: {
        inspections: inspectionsCount.error?.message ?? null,
        jobs: jobsCount.error?.message ?? null,
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
          job:jobs(
            id,
            status,
            scheduled_date,
            scheduled_time,
            duration_minutes,
            template_id,
            selected_service_ids,
            client:clients(id, name),
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

    return NextResponse.json({ tenantId, error: rawError?.message ?? null, sample: raw ?? [] });
  }
  const { data: inspections, error } = await supabaseAdmin
    .from("inspections")
    .select(
      `
        id,
        status,
        notes,
        job:jobs(
          id,
          status,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          template_id,
          selected_service_ids,
          client:clients(id, name),
          property:properties(
            address_line1, city, state, zip_code, property_type, year_built, square_feet,
            bedrooms, bathrooms, stories, foundation, garage, pool,
            basement, lot_size_acres, heating_type, cooling_type, roof_type,
            building_class, loading_docks, zoning, occupancy_type, ceiling_height,
            number_of_units, unit_mix, laundry_type, parking_spaces, elevator
          ),
          inspector:profiles(id, full_name, email, avatar_url)
        ),
        order:orders(
          id,
          status,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          client:clients(id, name),
          property:properties(
            address_line1, city, state, zip_code, property_type, year_built, square_feet,
            bedrooms, bathrooms, stories, foundation, garage, pool,
            basement, lot_size_acres, heating_type, cooling_type, roof_type,
            building_class, loading_docks, zoning, occupancy_type, ceiling_height,
            number_of_units, unit_mix, laundry_type, parking_spaces, elevator
          ),
        )
      `,
    )
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = Array.isArray(inspections) ? (inspections as unknown as InspectionRow[]) : [];
  const mapped = rows.map((row) => {
    const rawJob = unwrap(row.job) ?? unwrap(row.order);
    const job = rawJob
      ? {
          ...rawJob,
          client: unwrap(rawJob.client),
          property: unwrap(rawJob.property),
          inspector: unwrap(rawJob.inspector),
        }
      : null;
    const status = row.status === "submitted" ? "pending_report" : row.status === "draft" ? "scheduled" : row.status;

    return {
      id: row.id,
      status,
      notes: row.notes,
      inspector: job?.inspector ?? null,
      job: job
        ? {
            ...job,
            scheduled_time: normalizeTime(job.scheduled_time ?? null),
          }
        : null,
    };
  });

  return NextResponse.json(mapped);
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
        },
        "property_id" | "client_id" | "inspector_id" | "scheduled_date" | "scheduled_time" | "duration_minutes"
      > & { id: string })
    | null = null;

  if (orderId) {
    const { data: orderRow, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, property_id, client_id, inspector_id, scheduled_date, scheduled_time, duration_minutes")
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

  const { data: serviceRows } = await supabaseAdmin
    .from("services")
    .select("id, template_id, duration_minutes, price")
    .eq("tenant_id", tenantId)
    .in("id", Array.isArray(payload.types) ? payload.types : []);

  const { data: packageRows } = await supabaseAdmin
    .from("packages")
    .select("id, duration_minutes, price")
    .eq("tenant_id", tenantId)
    .in("id", Array.isArray(payload.types) ? payload.types : []);

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
    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .insert({
        tenant_id: tenantId,
        address_line1: street,
        city,
        state,
        zip_code: zip || "00000",
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

    if (propertyError || !property) {
      return NextResponse.json({ error: propertyError?.message ?? "Failed to create property." }, { status: 500 });
    }
    propertyId = property.id;
  }

  const effectiveClientId = payload.clientId ?? linkedOrder?.client_id ?? null;
  const effectiveInspectorId = payload.inspectorId ?? linkedOrder?.inspector_id ?? null;
  const scheduledDate = payload.date ?? linkedOrder?.scheduled_date ?? null;
  const scheduledTime = payload.time ?? linkedOrder?.scheduled_time ?? null;
  const jobDuration = durationMinutes || linkedOrder?.duration_minutes || 120;

  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .insert({
      tenant_id: tenantId,
      property_id: propertyId,
      client_id: effectiveClientId,
      template_id: templateId,
      inspector_id: effectiveInspectorId,
      status: "scheduled",
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime ?? null,
      duration_minutes: jobDuration,
      notes: payload.notes ?? null,
      selected_service_ids: Array.isArray(payload.types) ? payload.types : [],
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message ?? "Failed to create job." }, { status: 500 });
  }

  const { data: inspection, error: inspectionError } = await supabaseAdmin
    .from("inspections")
    .insert({
      tenant_id: tenantId,
      job_id: job.id,
      template_id: templateId,
      template_version: 1,
      status: "draft",
      notes: payload.notes ?? null,
      order_id: orderId ?? null,
    })
    .select("id")
    .single();

  if (inspectionError || !inspection) {
    return NextResponse.json({ error: inspectionError?.message ?? "Failed to create inspection." }, { status: 500 });
  }

  if (effectiveInspectorId) {
    await assignInspectionLead(tenantId, inspection.id, effectiveInspectorId);
  }

  if (effectiveInspectorId && scheduledDate) {
    const startTime = scheduledTime ? scheduledTime : "09:00";
    const startsAt = new Date(`${scheduledDate}T${startTime}:00`);
    const endsAt = new Date(startsAt.getTime() + jobDuration * 60_000);
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
