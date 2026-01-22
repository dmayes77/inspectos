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

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(
      `
        id,
        status,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        property:properties(address_line1, city, state, zip_code),
        inspector:profiles(id, full_name),
        inspection:inspections(
          id,
          status,
          services:inspection_services(id, name, price, duration_minutes)
        )
      `
    )
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (orders ?? []).map((order) => {
    const inspection = Array.isArray(order.inspection) ? order.inspection[0] : order.inspection;
    const services = inspection?.services ?? [];
    const totalPrice = services.reduce((sum, svc) => sum + Number(svc.price ?? 0), 0);
    const totalDuration =
      services.reduce((sum, svc) => sum + Number(svc.duration_minutes ?? 0), 0) ||
      order.duration_minutes ||
      0;
    const primary = services[0];

    const property = Array.isArray(order.property) ? order.property[0] : order.property;

    return {
      id: order.id,
      date: order.scheduled_date ?? "",
      time: normalizeTime(order.scheduled_time ?? null),
      address: property ? buildAddress(property) : "",
      inspector: order.inspector?.full_name ?? "",
      inspectorId: order.inspector?.id ?? "",
      status: order.status,
      type: primary?.name ?? "Inspection",
      price: totalPrice,
      durationMinutes: totalDuration,
    };
  });

  return NextResponse.json(mapped);
}
