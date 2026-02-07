import { NextRequest } from "next/server";
import { createUserClient, getAccessToken, getUserFromToken, unauthorized, badRequest, serverError, success } from "@/lib/supabase";
import { resolveTenant } from "@/lib/tenants";

/**
 * GET /api/admin/inspectors
 *
 * Returns inspectors for a tenant.
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
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
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest("Tenant not found");
    }

    const { data: members, error: membersError } = await supabase
      .from("tenant_members")
      .select("user_id, role, profiles(id, full_name, email)")
      .eq("tenant_id", tenant.id)
      .in("role", ["inspector"]);

    if (membersError) {
      return serverError("Failed to fetch inspectors", membersError);
    }

    const inspectors = (members || []).map((row) => {
      // Supabase types nested relations as arrays, but single() returns an object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = Array.isArray((row as any).profiles) ? (row as any).profiles[0] : (row as any).profiles;
      return {
        teamMemberId: profile?.id ?? row.user_id,
        name: profile?.full_name ?? profile?.email ?? 'Unknown',
      };
    });

    return success(inspectors);
  } catch (error) {
    return serverError("Failed to fetch inspectors", error);
  }
}
