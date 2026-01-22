import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createInspectionSchema } from "@/lib/validations/inspection-api";

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
          inspector:profiles(id, full_name, email, avatar_url),
          job:jobs(
            id,
            status,
            scheduled_date,
            scheduled_time,
            duration_minutes,
            template_id,
            selected_service_ids,
            client:clients(id, name),
            property:properties(address_line1, city, state, zip_code, property_type, year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool),
            inspector:profiles(id, full_name, email, avatar_url)
          )
        `
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
        inspector:profiles(id, full_name, email, avatar_url),
        job:jobs(
          id,
          status,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          template_id,
          selected_service_ids,
          client:clients(id, name),
          property:properties(address_line1, city, state, zip_code, property_type, year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool),
          inspector:profiles(id, full_name, email, avatar_url)
        ),
        order:orders(
          id,
          status,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          client:clients(id, name),
          property:properties(address_line1, city, state, zip_code, property_type, year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool),
          inspector:profiles(id, full_name, email, avatar_url)
        )
      `
    )
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (inspections ?? []).map((row) => {
    const rawJob = unwrap(row.job) ?? unwrap(row.order);
    const job = rawJob
      ? {
          ...rawJob,
          client: unwrap(rawJob.client),
          property: unwrap(rawJob.property),
          inspector: unwrap(rawJob.inspector),
        }
      : null;
    const status =
      row.status === "submitted"
        ? "pending_report"
        : row.status === "draft"
        ? "scheduled"
        : row.status;

    return {
      id: row.id,
      status,
      notes: row.notes,
      inspector: unwrap(row.inspector),
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

const parseAddress = (address: string) => {
  const [line1Raw, restRaw, altRaw] = address.split(",").map((part) => part.trim());
  const line1 = line1Raw || address;
  const rest = altRaw ? `${restRaw ?? ""} ${altRaw}`.trim() : restRaw ?? "";
  const parts = rest.split(" ").filter(Boolean);
  const zip = parts.pop() ?? "";
  const state = parts.pop() ?? "";
  const city = parts.join(" ") || "Unknown";
  return { line1, city, state, zip };
};

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createInspectionSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

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
      const { data: packageItems } = await supabaseAdmin
        .from("package_items")
        .select("service_id")
        .in("package_id", packageIds);
      const serviceIds = (packageItems ?? []).map((item) => item.service_id);
      if (serviceIds.length > 0) {
        const { data: packageServices } = await supabaseAdmin
          .from("services")
          .select("template_id")
          .eq("tenant_id", tenantId)
          .in("id", serviceIds);
        templateId = packageServices?.[0]?.template_id ?? null;
      }
    }
  }

  const durationMinutes =
    (serviceRows?.reduce((sum, svc) => sum + (svc.duration_minutes ?? 0), 0) ?? 0) +
    (packageRows?.reduce((sum, pkg) => sum + (pkg.duration_minutes ?? 0), 0) ?? 0);

  const { line1, city, state, zip } = parseAddress(payload.address ?? "");
  const { data: existingProperty } = await supabaseAdmin
    .from("properties")
    .select("id, client_id")
    .eq("tenant_id", tenantId)
    .eq("address_line1", line1)
    .eq("city", city)
    .eq("state", state)
    .eq("zip_code", zip || "00000")
    .maybeSingle();

  let propertyId = existingProperty?.id ?? null;
  if (!propertyId) {
    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .insert({
        tenant_id: tenantId,
        client_id: payload.clientId ?? null,
        address_line1: line1,
        city,
        state,
        zip_code: zip || "00000",
        property_type: payload.propertyType ?? "residential",
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

  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .insert({
      tenant_id: tenantId,
      property_id: propertyId,
      client_id: payload.clientId ?? null,
      template_id: templateId,
      inspector_id: payload.inspectorId ?? null,
      status: "scheduled",
      scheduled_date: payload.date,
      scheduled_time: payload.time ?? null,
      duration_minutes: durationMinutes || 120,
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
      inspector_id: payload.inspectorId ?? null,
      status: "draft",
      notes: payload.notes ?? null,
    })
    .select("id")
    .single();

  if (inspectionError || !inspection) {
    return NextResponse.json({ error: inspectionError?.message ?? "Failed to create inspection." }, { status: 500 });
  }

  if (payload.inspectorId && payload.date) {
    const startTime = payload.time ? payload.time : "09:00";
    const startsAt = new Date(`${payload.date}T${startTime}:00`);
    const endsAt = new Date(startsAt.getTime() + (durationMinutes || 120) * 60_000);
    await supabaseAdmin.from("schedule_blocks").insert({
      tenant_id: tenantId,
      inspector_id: payload.inspectorId,
      inspection_id: inspection.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "scheduled",
    });
  }

  return NextResponse.json({ inspectionId: inspection.id });
}
