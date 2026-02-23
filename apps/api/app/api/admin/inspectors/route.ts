import { serverError, success } from "@/lib/supabase";
import { withAuth } from "@/lib/api/with-auth";

/**
 * GET /api/admin/inspectors
 *
 * Returns inspectors for a tenant.
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
 */
export const GET = withAuth(async ({ serviceClient, tenant }) => {
  const { data: members, error: membersError } = await serviceClient
    .from("tenant_members")
    .select("user_id, role, profiles(id, full_name, email, is_inspector)")
    .eq("tenant_id", tenant.id);

  if (membersError) {
    return serverError("Failed to fetch inspectors", membersError);
  }

  const inspectors = (members || [])
    .filter((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = Array.isArray((row as any).profiles) ? (row as any).profiles[0] : (row as any).profiles;
      return row.role === "inspector" || Boolean(profile?.is_inspector);
    })
    .map((row) => {
    // Supabase types nested relations as arrays, but single() returns an object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = Array.isArray((row as any).profiles) ? (row as any).profiles[0] : (row as any).profiles;
    return {
      teamMemberId: profile?.id ?? row.user_id,
      name: profile?.full_name ?? profile?.email ?? 'Unknown',
    };
  });

  return success(inspectors);
});
