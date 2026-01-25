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

const mapJobStatus = (status: string) => {
  if (status === "in_progress") return "in_progress";
  if (status === "completed" || status === "pending_report") return "completed";
  return "scheduled";
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
          inspector:profiles(id, full_name)
        )
      `,
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "Inspection not found." }, { status: 404 });
  }

  // Supabase types nested relations as arrays but .maybeSingle() returns objects
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

  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("tenant_id", tenantId)
    .eq("template_id", job?.template_id ?? "00000000-0000-0000-0000-000000000000")
    .eq("is_active", true);

  const selectedIds = job?.selected_service_ids ?? [];

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
  const selectedList = selectedIds.map((id) => selectedServiceMap.get(id)).filter(Boolean) as {
    id: string;
    price: number;
    duration: number;
  }[];
  const activeList = selectedList.length > 0 ? selectedList : serviceList;
  const price = activeList.reduce((sum, svc) => sum + svc.price, 0);
  const duration = activeList.reduce((sum, svc) => sum + svc.duration, 0) || job?.duration_minutes || 0;

  const status = row.status === "submitted" ? "pending_report" : row.status === "draft" ? "scheduled" : row.status;

  return NextResponse.json({
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

  const { data: inspection } = await supabaseAdmin.from("inspections").select("id, job_id").eq("tenant_id", tenantId).eq("id", id).maybeSingle();

  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found." }, { status: 404 });
  }

  const { data: job } = await supabaseAdmin.from("jobs").select("id, property_id").eq("tenant_id", tenantId).eq("id", inspection.job_id).maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "Job not found for inspection." }, { status: 404 });
  }

  let templateId: string | null | undefined;
  let durationMinutes: number | undefined;
  if (Array.isArray(payload.types) && payload.types.length > 0) {
    const { data: serviceRows } = await supabaseAdmin
      .from("services")
      .select("id, template_id, duration_minutes")
      .eq("tenant_id", tenantId)
      .in("id", payload.types);

    const { data: packageRows } = await supabaseAdmin.from("packages").select("id, duration_minutes").eq("tenant_id", tenantId).in("id", payload.types);

    templateId = serviceRows?.[0]?.template_id ?? null;
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

  if (payload.propertyType !== undefined) {
    propertyUpdate.property_type = payload.propertyType ?? null;
  }

  if (payload.yearBuilt !== undefined) {
    propertyUpdate.year_built = payload.yearBuilt ?? null;
  }

  if (payload.sqft !== undefined) {
    propertyUpdate.square_feet = payload.sqft ?? null;
  }

  if (payload.bedrooms !== undefined) {
    propertyUpdate.bedrooms = payload.bedrooms ?? null;
  }

  if (payload.bathrooms !== undefined) {
    propertyUpdate.bathrooms = payload.bathrooms ?? null;
  }

  if (payload.stories !== undefined) {
    propertyUpdate.stories = payload.stories ?? null;
  }

  if (payload.foundation !== undefined) {
    propertyUpdate.foundation = payload.foundation ?? null;
  }

  if (payload.garage !== undefined) {
    propertyUpdate.garage = payload.garage ?? null;
  }

  if (payload.pool !== undefined) {
    propertyUpdate.pool = payload.pool ?? null;
  }

  if (payload.clientId !== undefined) {
    // property owners will be synced after update below
  }

  if (job.property_id && Object.keys(propertyUpdate).length > 0) {
    await supabaseAdmin.from("properties").update(propertyUpdate).eq("tenant_id", tenantId).eq("id", job.property_id);
    if (payload.clientId !== undefined) {
      await syncPropertyOwner(tenantId, job.property_id, payload.clientId ?? null);
    }
  }

  const jobUpdate: {
    client_id?: string | null;
    inspector_id?: string | null;
    scheduled_date?: string;
    scheduled_time?: string | null;
    notes?: string | null;
    status?: string;
    template_id?: string | null;
    duration_minutes?: number | null;
    property_id?: string | null;
    selected_service_ids?: string[] | null;
  } = {};

  if (payload.clientId !== undefined) {
    jobUpdate.client_id = payload.clientId ?? null;
  }

  if (payload.inspectorId !== undefined) {
    jobUpdate.inspector_id = payload.inspectorId ?? null;
  }

  if (payload.date !== undefined) {
    jobUpdate.scheduled_date = payload.date;
  }

  if (payload.time !== undefined) {
    jobUpdate.scheduled_time = payload.time ?? null;
  }

  if (payload.notes !== undefined) {
    jobUpdate.notes = payload.notes ?? null;
  }

  if (payload.status !== undefined) {
    jobUpdate.status = mapJobStatus(payload.status);
  }

  if (templateId !== undefined) {
    jobUpdate.template_id = templateId;
  }

  if (durationMinutes !== undefined) {
    jobUpdate.duration_minutes = durationMinutes || null;
  }

  if (payload.types !== undefined) {
    jobUpdate.selected_service_ids = Array.isArray(payload.types) ? payload.types : [];
  }

  if (!job.property_id && Object.keys(propertyUpdate).length > 0 && payload.address) {
    const addressParts = parseAddress(payload.address);
    const { data: property, error: propertyError } = await supabaseAdmin
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

    if (propertyError) {
      return NextResponse.json({ error: propertyError.message }, { status: 500 });
    }
    if (property) {
      jobUpdate.property_id = property.id;
      if (payload.clientId !== undefined) {
        await syncPropertyOwner(tenantId, property.id, payload.clientId ?? null);
      }
    }
  }

  if (Object.keys(jobUpdate).length > 0) {
    await supabaseAdmin.from("jobs").update(jobUpdate).eq("tenant_id", tenantId).eq("id", inspection.job_id);
  }

  const inspectionUpdate: {
    status?: string;
    notes?: string | null;
    template_id?: string | null;
  } = {};

  if (payload.status !== undefined) {
    inspectionUpdate.status = mapStatusToDb(payload.status);
  }

  if (payload.notes !== undefined) {
    inspectionUpdate.notes = payload.notes ?? null;
  }

  if (templateId !== undefined) {
    inspectionUpdate.template_id = templateId;
  }

  if (Object.keys(inspectionUpdate).length > 0) {
    await supabaseAdmin.from("inspections").update(inspectionUpdate).eq("tenant_id", tenantId).eq("id", id);
  }

  if (payload.inspectorId !== undefined) {
    await unassignInspectionRanks(tenantId, id);
    if (payload.inspectorId) {
      await assignInspectionLead(tenantId, id, payload.inspectorId);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: inspection } = await supabaseAdmin.from("inspections").select("id, job_id").eq("tenant_id", tenantId).eq("id", id).maybeSingle();

  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found." }, { status: 404 });
  }

  await supabaseAdmin.from("inspections").delete().eq("tenant_id", tenantId).eq("id", id);
  await supabaseAdmin.from("jobs").delete().eq("tenant_id", tenantId).eq("id", inspection.job_id);

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
