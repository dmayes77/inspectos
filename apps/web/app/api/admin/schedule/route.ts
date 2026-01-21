import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

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
        job:jobs(
          id,
          status,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          template_id,
          client:clients(id, name),
          property:properties(address_line1, city, state, zip_code),
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

  const mapped = (inspections ?? []).map((row) => {
    // Supabase types nested relations as arrays, use unknown to convert
    const job = row.job as unknown as {
      id: string;
      status: string;
      scheduled_date: string;
      scheduled_time: string | null;
      duration_minutes: number | null;
      template_id: string | null;
      client: { id: string; name: string } | null;
      property: { address_line1: string; city: string; state: string; zip_code: string } | null;
      inspector: { id: string; full_name: string | null } | null;
    };
    const serviceList = job?.template_id ? servicesByTemplate.get(job.template_id) ?? [] : [];
    const price = serviceList.reduce((sum, svc) => sum + svc.price, 0);
    const duration = serviceList.reduce((sum, svc) => sum + svc.duration, 0) || job?.duration_minutes || 0;
    const primary = serviceList[0];

    return {
      id: row.id,
      date: job?.scheduled_date ?? "",
      time: normalizeTime(job?.scheduled_time ?? null),
      address: job?.property ? buildAddress(job.property) : "",
      inspector: job?.inspector?.full_name ?? "",
      inspectorId: job?.inspector?.id ?? "",
      status: row.status,
      type: primary?.name ?? "Inspection",
      price,
      durationMinutes: duration,
    };
  });

  return NextResponse.json(mapped);
}
