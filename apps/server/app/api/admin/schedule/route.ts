import { NextRequest } from "next/server";
import { createUserClient, getAccessToken, getUserFromToken, unauthorized, badRequest, serverError, success } from "@/lib/supabase";
import { resolveTenant } from "@/lib/tenants";

/**
 * GET /api/admin/schedule
 *
 * Returns schedule items derived from jobs.
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
      .from("jobs")
      .select(
        `
        id,
        scheduled_date,
        scheduled_time,
        status,
        duration_minutes,
        selected_service_ids,
        property:properties(address_line1, address_line2, city, state, zip_code),
        template:templates(id, name),
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

    const { data: jobs, error: jobsError } = await query;
    if (jobsError) {
      return serverError("Failed to fetch schedule", jobsError);
    }

    const scheduleItems = (jobs || []).map((job) => {
      const propertyData = Array.isArray(job.property) ? job.property[0] : job.property;
      const property = propertyData as {
        address_line1: string;
        address_line2: string | null;
        city: string;
        state: string;
        zip_code: string;
      } | null;
      const inspectorData = Array.isArray(job.inspector) ? job.inspector[0] : job.inspector;
      const inspector = inspectorData as { id: string; full_name: string | null; email: string } | null;
      const address = property
        ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`].filter(Boolean).join(", ")
        : "Unknown address";

      return {
        id: job.id,
        date: job.scheduled_date,
        time: job.scheduled_time || "09:00",
        address,
        inspector: inspector?.full_name || inspector?.email || "Unassigned",
        inspectorId: inspector?.id || "unassigned",
        status: job.status,
        type: (job.template as { name?: string | null })?.name || "Inspection",
        price: 0,
        durationMinutes: job.duration_minutes || 120,
      };
    });

    return success(scheduleItems);
  } catch (error) {
    return serverError("Failed to fetch schedule", error);
  }
}
