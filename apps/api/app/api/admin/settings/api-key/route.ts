import { badRequest, serverError, success } from "@/lib/supabase";
import { requirePermission, withAuth } from "@/lib/api/with-auth";
import { generateBusinessApiKey, hashBusinessApiKey, toApiKeyPreview } from "@/lib/api/business-api-keys";

/**
 * POST /api/admin/settings/api-key
 * Regenerate the business API key.
 */
export const POST = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions }) => {
  const permissionCheck = requirePermission(
    memberRole,
    "edit_settings",
    "You do not have permission to regenerate API keys",
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  let nextApiKey = generateBusinessApiKey();
  const now = new Date().toISOString();

  // Retry on unique collisions (extremely unlikely) and return deterministic error if exhausted.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error: revokeError } = await serviceClient
      .from("business_api_keys")
      .update({ revoked_at: now, updated_at: now })
      .eq("tenant_id", tenant.id)
      .is("revoked_at", null);

    if (revokeError) {
      return serverError("Failed to rotate existing API keys", revokeError);
    }

    const keyPrefix = nextApiKey.slice(0, 12);
    const keyHash = hashBusinessApiKey(nextApiKey);

    const { data, error } = await serviceClient
      .from("business_api_keys")
      .insert({
        tenant_id: tenant.id,
        name: "Primary Key",
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: ["admin:api"],
      })
      .select("id, key_prefix, created_at")
      .maybeSingle();

    if (!error && data?.id) {
      return success({
        apiKey: nextApiKey,
        apiKeyPreview: toApiKeyPreview(data.key_prefix),
        apiKeyLastRotatedAt: data.created_at,
      });
    }

    if (error?.code !== "23505") {
      if (!data) return badRequest("Business not found");
      return serverError("Failed to regenerate API key", error);
    }

    nextApiKey = generateBusinessApiKey();
  }

  return serverError("Failed to regenerate API key");
});
