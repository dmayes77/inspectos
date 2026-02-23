import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

export type BusinessApiKeyRecord = {
  id: string;
  tenant_id: string;
  key_prefix: string;
  scopes: string[] | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    business_id?: string;
  };
};

export function generateBusinessApiKey(): string {
  return `isk_${randomBytes(16).toString("hex")}`;
}

export function hashBusinessApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function getBusinessApiKey(request: NextRequest): string | null {
  const header = request.headers.get("x-api-key")?.trim();
  if (header) return header;

  const auth = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!auth) return null;
  if (auth.toLowerCase().startsWith("apikey ")) {
    return auth.slice(7).trim() || null;
  }

  return null;
}

export function toApiKeyPreview(prefix: string): string {
  return `${prefix}••••••••`;
}

export async function resolveBusinessByApiKey(
  serviceClient: SupabaseClient,
  apiKey: string,
): Promise<{ key: BusinessApiKeyRecord | null; error?: Error }> {
  const keyHash = hashBusinessApiKey(apiKey);
  const { data, error } = await serviceClient
    .from("business_api_keys")
    .select("id, tenant_id, key_prefix, scopes, tenant:tenants(id, name, slug, business_id)")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) {
    return { key: null, error: error ?? new Error("API key not found") };
  }

  // Best-effort write for usage telemetry.
  await serviceClient.from("business_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  const tenantRow = Array.isArray(data.tenant) ? data.tenant[0] : data.tenant;
  if (!tenantRow) {
    return { key: null, error: new Error("Business not found for API key") };
  }

  return {
    key: {
      id: data.id,
      tenant_id: data.tenant_id,
      key_prefix: data.key_prefix,
      scopes: data.scopes as string[] | null,
      tenant: tenantRow as BusinessApiKeyRecord["tenant"],
    },
  };
}
