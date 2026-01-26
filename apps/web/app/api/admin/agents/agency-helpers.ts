import { supabaseAdmin } from "@/lib/supabase/server";

export type AgencyResolutionOptions = {
  tenantId: string;
  agencyId?: string | null;
  agencyName?: string | null;
  brandLogoUrl?: string | null;
  agencyAddress?: string | null;
};

const normalize = (value?: string | null) => value?.trim() || null;

const primaryAddressLine = (address?: string | null) => {
  if (!address) return null;
  const lines = address
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[0] ?? address.trim() ?? null;
};

export async function resolveAgencyAssociation(options: AgencyResolutionOptions): Promise<string | null> {
  const existingAgencyId = options.agencyId ?? null;
  const agencyName = normalize(options.agencyName);

  if (existingAgencyId || !agencyName) {
    return existingAgencyId;
  }

  const { data: foundAgency, error: lookupError } = await supabaseAdmin
    .from("agencies")
    .select("id")
    .eq("tenant_id", options.tenantId)
    .ilike("name", agencyName)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (foundAgency?.id) {
    return foundAgency.id;
  }

  const { data: newAgency, error: createError } = await supabaseAdmin
    .from("agencies")
    .insert({
      tenant_id: options.tenantId,
      name: agencyName,
      status: "active",
      logo_url: options.brandLogoUrl ?? null,
      address_line1: primaryAddressLine(options.agencyAddress),
    })
    .select("id")
    .single();

  if (createError || !newAgency) {
    throw new Error(createError?.message ?? "Failed to create agency");
  }

  return newAgency.id;
}
