import { badRequest } from "@/lib/supabase";
import { withAuth } from "@/lib/api/with-auth";

type LogoDevResult = {
  name?: string | null;
  domain?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  website_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

type AgencyLookupResult = {
  id: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  source: string;
};

function successWithBrandMeta(data: AgencyLookupResult[], brandSearchEnabled: boolean): Response {
  return Response.json({
    success: true,
    data,
    meta: { brandSearchEnabled },
  });
}

function normalizeDomain(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "").trim().toLowerCase();
}

function coerceLogoDevArray(payload: unknown): LogoDevResult[] {
  if (Array.isArray(payload)) return payload as LogoDevResult[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as LogoDevResult[];
    if (Array.isArray(obj.data)) return obj.data as LogoDevResult[];
    if (Array.isArray(obj.brands)) return obj.brands as LogoDevResult[];
  }
  return [];
}

function mapResult(item: LogoDevResult, index: number): AgencyLookupResult | null {
  const name = item.name?.trim();
  const rawDomain = item.domain?.trim() ?? item.website?.trim() ?? item.website_url?.trim() ?? null;
  const domain = rawDomain ? normalizeDomain(rawDomain) : null;
  if (!name && !domain) return null;

  const website = item.website?.trim() || item.website_url?.trim() || (domain ? `https://${domain}` : null);
  const id = domain ? `logo-dev:${domain}` : `logo-dev:${name ?? "result"}:${index}`;

  return {
    id,
    name: name || (domain ?? "Unknown Agency"),
    domain,
    logoUrl: item.logo_url?.trim() || item.logoUrl?.trim() || null,
    website,
    email: item.email?.trim() || null,
    phone: item.phone?.trim() || null,
    addressLine1: item.address_line1?.trim() || null,
    addressLine2: item.address_line2?.trim() || null,
    city: item.city?.trim() || null,
    state: item.state?.trim() || null,
    postalCode: item.postal_code?.trim() || item.zip_code?.trim() || null,
    country: item.country?.trim() || null,
    source: "logo-dev",
  };
}

/**
 * GET /api/admin/agencies/lookup?q=<query>
 * Server-side agency brand lookup via Logo.dev.
 */
export const GET = withAuth(async ({ request }) => {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return badRequest("Query must be at least 2 characters");
  }

  const logoDevKey = process.env.LOGO_DEV_SECRET_KEY?.trim() ?? "";
  if (!logoDevKey) {
    return successWithBrandMeta([], false);
  }

  try {
    const response = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${logoDevKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return successWithBrandMeta([], true);
    }

    const payload = await response.json().catch(() => ({}));
    const rawResults = coerceLogoDevArray(payload);
    const mapped = rawResults
      .map((item, index) => mapResult(item, index))
      .filter((value): value is AgencyLookupResult => Boolean(value))
      .slice(0, 10);

    return successWithBrandMeta(mapped, true);
  } catch {
    return successWithBrandMeta([], true);
  }
});
