import { NextRequest } from "next/server";
import { createUserClient, getAccessToken, getUserFromToken, unauthorized, badRequest, serverError, success } from "@/lib/supabase";
import { resolveTenant } from "@/lib/tenants";

/**
 * GET /api/admin/schedule
 *
 * Returns schedule items derived from orders.
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
 * - from: start date (YYYY-MM-DD)
 * - to: end date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized("Missing access token");
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized("Invalid access token");
    }

    const tenantSlug = request.nextUrl.searchParams.get("tenant");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest("Tenant not found");
    }

    let query = supabase
      .from("orders")
      .select(
        `
        id,
        scheduled_date,
        scheduled_time,
        status,
        duration_minutes,
        inspector_id,
        property:properties(address_line1, address_line2, city, state, zip_code),
        inspector:profiles(id, full_name, email)
      `,
      )
      .eq("tenant_id", tenant.id)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (from) {
      query = query.gte("scheduled_date", from);
    }
    if (to) {
      query = query.lte("scheduled_date", to);
    }

    const { data: orders, error: ordersError } = await query;
    if (ordersError) {
      console.error("Schedule query error:", ordersError);
      return serverError("Failed to fetch schedule", ordersError);
    }

    const scheduleItems = (orders || []).map((order) => {
      const propertyData = Array.isArray(order.property) ? order.property[0] : order.property;
      const property = propertyData as {
        address_line1: string;
        address_line2: string | null;
        city: string;
        state: string;
        zip_code: string;
      } | null;
      const inspectorData = Array.isArray(order.inspector) ? order.inspector[0] : order.inspector;
      const inspector = inspectorData as { id: string; full_name: string | null; email: string } | null;
      const address = property
        ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`].filter(Boolean).join(", ")
        : "Unknown address";

      return {
        id: order.id,
        date: order.scheduled_date,
        time: order.scheduled_time || "09:00",
        address,
        inspector: inspector?.full_name || inspector?.email || "Unassigned",
        inspectorId: inspector?.id || order.inspector_id || "unassigned",
        status: order.status,
        type: "Inspection",
        price: 0,
        durationMinutes: order.duration_minutes || 120,
      };
    });

    return success(scheduleItems);
  } catch (error) {
    return serverError("Failed to fetch schedule", error);
  }
}
