import { createServiceClient } from '@/lib/supabase';

export type AgencyResolutionOptions = {
  tenantId: string;
  agencyId?: string | null;
  agencyName?: string | null;
  brandLogoUrl?: string | null;
  agencyAddress?: string | null;
  agencyWebsite?: string | null;
};

type ParsedAddress = {
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

const ADDRESS_FIELDS: Array<keyof ParsedAddress> = ["address_line1", "address_line2", "city", "state", "zip_code"];

const ZIP_REGEX = /(\b\d{5}(?:-\d{4})?\b)/;
const STATE_REGEX = /^[A-Za-z]{2}$/;

const normalize = (value?: string | null) => value?.trim() || null;

const normalizeWebsite = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!sanitized) return null;
  return `https://${sanitized}`;
};

const tokenizedAddress = (address: string) =>
  address
    .split(/\r?\n+/)
    .flatMap((line) => line.split(","))
    .map((token) => token.trim())
    .filter(Boolean);

const parseAddressSegments = (address?: string | null): ParsedAddress | null => {
  const trimmed = address?.trim();
  if (!trimmed) return null;

  const tokens = tokenizedAddress(trimmed);
  if (tokens.length === 0) {
    return {
      address_line1: trimmed,
      address_line2: null,
      city: null,
      state: null,
      zip_code: null,
    };
  }

  const remaining = [...tokens];
  const addressLine1 = (remaining.shift() ?? trimmed).trim();

  let zipCode: string | null = null;
  let state: string | null = null;
  let city: string | null = null;

  if (remaining.length > 0) {
    const last = remaining[remaining.length - 1];
    const zipMatch = last.match(ZIP_REGEX);
    if (zipMatch) {
      zipCode = zipMatch[1];
      const cleaned = last.replace(zipMatch[0], "").trim();
      if (cleaned) {
        remaining[remaining.length - 1] = cleaned;
      } else {
        remaining.pop();
      }
    }
  }

  if (remaining.length > 0) {
    const possibleState = remaining[remaining.length - 1].toUpperCase();
    if (STATE_REGEX.test(possibleState)) {
      state = possibleState;
      remaining.pop();
    }
  }

  if (!state && remaining.length > 0) {
    const tail = remaining[remaining.length - 1].split(/\s+/);
    const lastToken = tail[tail.length - 1]?.toUpperCase();
    if (lastToken && STATE_REGEX.test(lastToken)) {
      state = lastToken;
      tail.pop();
      const rebuilt = tail.join(" ").trim();
      if (rebuilt) {
        remaining[remaining.length - 1] = rebuilt;
      } else {
        remaining.pop();
      }
    }
  }

  if (remaining.length > 0) {
    city = remaining.pop() ?? null;
  }

  const addressLine2 = remaining.length > 0 ? remaining.join(", ") : null;

  return {
    address_line1: addressLine1 || null,
    address_line2: addressLine2?.trim() || null,
    city: city?.trim() || null,
    state: state ?? null,
    zip_code: zipCode ?? null,
  };
};

async function backfillAgencyAddress(tenantId: string, agencyId: string, address?: ParsedAddress | null, website?: string | null) {
  if (!address && !website) return;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agencies")
    .select("id, address_line1, address_line2, city, state, zip_code, website")
    .eq("tenant_id", tenantId)
    .eq("id", agencyId)
    .single();

  if (error || !data) {
    return;
  }

  const updates: Partial<ParsedAddress> & { website?: string | null } = {};
  ADDRESS_FIELDS.forEach((field) => {
    const nextValue = address?.[field] ?? null;
    if (!data[field] && nextValue) {
      updates[field] = nextValue;
    }
  });

  if (!data.website && website) {
    updates.website = website;
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  await supabase.from("agencies").update(updates).eq("tenant_id", tenantId).eq("id", agencyId);
}

export async function resolveAgencyAssociation(options: AgencyResolutionOptions): Promise<string | null> {
  const parsedAddress = parseAddressSegments(options.agencyAddress);
  const normalizedWebsite = normalizeWebsite(options.agencyWebsite);
  const existingAgencyId = options.agencyId ?? null;

  if (existingAgencyId) {
    await backfillAgencyAddress(options.tenantId, existingAgencyId, parsedAddress, normalizedWebsite);
    return existingAgencyId;
  }

  const agencyName = normalize(options.agencyName);

  if (!agencyName) {
    return null;
  }

  const supabase = createServiceClient();
  const { data: foundAgency, error: lookupError } = await supabase
    .from("agencies")
    .select("id")
    .eq("tenant_id", options.tenantId)
    .ilike("name", agencyName)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (foundAgency?.id) {
    await backfillAgencyAddress(options.tenantId, foundAgency.id, parsedAddress, normalizedWebsite);
    return foundAgency.id;
  }

  const { data: newAgency, error: createError } = await supabase
    .from("agencies")
    .insert({
      tenant_id: options.tenantId,
      name: agencyName,
      status: "active",
      logo_url: options.brandLogoUrl ?? null,
      website: normalizedWebsite,
      ...(parsedAddress ?? {}),
    })
    .select("id")
    .single();

  if (createError || !newAgency) {
    throw new Error(createError?.message ?? "Failed to create agency");
  }

  return newAgency.id;
}
