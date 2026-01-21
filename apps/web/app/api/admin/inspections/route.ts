import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createInspectionSchema } from "@/lib/validations/inspection-api";

const normalizeTime = (time?: string | null) => {
  if (!time) return "";
  return time.slice(0, 5);
};

const buildAddress = (property: {
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
}) => `${property.address_line1}, ${property.city}, ${property.state} ${property.zip_code}`;

export async function GET() {
  const tenantId = getTenantId();
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
          property:properties(address_line1, city, state, zip_code, property_type, year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool),
          inspector:profiles(id, full_name)
        )
      `
    )
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const templateIds = Array.from(
    new Set(
      (inspections ?? [])
        .map((row) => (row.job as { template_id?: string | null })?.template_id)
        .filter(Boolean) as string[]
    )
  );

  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_minutes, template_id")
    .eq("tenant_id", tenantId)
    .in("template_id", templateIds.length ? templateIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_active", true);

  const selectedServiceIds = Array.from(
    new Set(
      (inspections ?? [])
        .flatMap((row) => ((row.job as { selected_service_ids?: string[] | null })?.selected_service_ids ?? []))
        .filter(Boolean)
    )
  );

  const { data: selectedServices } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("tenant_id", tenantId)
    .in("id", selectedServiceIds.length ? selectedServiceIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_active", true);

  const { data: selectedPackages } = await supabaseAdmin
    .from("packages")
    .select("id, name, price, duration_minutes")
    .eq("tenant_id", tenantId)
    .in("id", selectedServiceIds.length ? selectedServiceIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_active", true);

  const servicesByTemplate = new Map<string, { id: string; name: string; price: number; duration: number }[]>();
  (services ?? []).forEach((service) => {
    const list = servicesByTemplate.get(service.template_id) ?? [];
    list.push({
      id: service.id,
      name: service.name,
      price: Number(service.price ?? 0),
      duration: service.duration_minutes ?? 0,
    });
    servicesByTemplate.set(service.template_id, list);
  });

  const selectedServiceMap = new Map<string, { id: string; name: string; price: number; duration: number }>();
  (selectedServices ?? []).forEach((service) => {
    selectedServiceMap.set(service.id, {
      id: service.id,
      name: service.name,
      price: Number(service.price ?? 0),
      duration: service.duration_minutes ?? 0,
    });
  });

  (selectedPackages ?? []).forEach((pkg) => {
    selectedServiceMap.set(pkg.id, {
      id: pkg.id,
      name: pkg.name,
      price: Number(pkg.price ?? 0),
      duration: pkg.duration_minutes ?? 0,
    });
  });

  const mapped = (inspections ?? []).map((row) => {
    // Supabase types nested relations as arrays, use unknown to convert
    const job = row.job as unknown as {
      id: string;
      status: string;
      scheduled_date: string;
      scheduled_time: string | null;
      duration_minutes: number | null;
      template_id: string | null;
      selected_service_ids?: string[] | null;
      client: { id: string; name: string } | null;
      property: {
        address_line1: string;
        city: string;
        state: string;
          zip_code: string;
          property_type?: string | null;
          year_built?: number | null;
          square_feet?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          stories?: string | null;
          foundation?: string | null;
          garage?: string | null;
          pool?: boolean | null;
      } | null;
      inspector: { id: string; full_name: string | null } | null;
    };

    const selectedIds = job?.selected_service_ids ?? [];
    const selectedList = selectedIds.map((id) => selectedServiceMap.get(id)).filter(Boolean) as {
      id: string;
      name: string;
      price: number;
      duration: number;
    }[];
    const serviceList = job?.template_id ? servicesByTemplate.get(job.template_id) ?? [] : [];
    const activeList = selectedList.length > 0 ? selectedList : serviceList;
    const price = activeList.reduce((sum, svc) => sum + svc.price, 0);
    const duration = activeList.reduce((sum, svc) => sum + svc.duration, 0) || job?.duration_minutes || 0;

    const status =
      row.status === "submitted"
        ? "pending_report"
        : row.status === "draft"
        ? "scheduled"
        : row.status;

    return {
      inspectionId: row.id,
      jobId: job?.id ?? "",
      address: job?.property ? buildAddress(job.property) : "",
      client: job?.client?.name ?? "",
      clientId: job?.client?.id ?? "",
      inspector: job?.inspector?.full_name ?? "",
      inspectorId: job?.inspector?.id ?? "",
      date: job?.scheduled_date ?? "",
      time: normalizeTime(job?.scheduled_time ?? null),
      types: selectedList.length > 0 ? selectedList.map((svc) => svc.id) : serviceList.map((svc) => svc.id),
      status,
      price,
      sqft: job?.property?.square_feet ?? undefined,
      yearBuilt: job?.property?.year_built ?? undefined,
      propertyType: job?.property?.property_type ?? undefined,
      bedrooms: job?.property?.bedrooms ?? undefined,
      bathrooms: job?.property?.bathrooms ?? undefined,
      stories: job?.property?.stories ?? undefined,
      foundation: job?.property?.foundation ?? undefined,
      garage: job?.property?.garage ?? undefined,
      pool: job?.property?.pool ?? undefined,
      notes: row.notes ?? undefined,
      durationMinutes: duration,
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
