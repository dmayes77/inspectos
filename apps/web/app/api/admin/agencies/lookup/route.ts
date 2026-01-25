import { NextRequest, NextResponse } from "next/server";
import { resolveLogoUrl } from "@/lib/utils/logos";

const LOGO_DEV_SECRET_KEY = process.env.LOGO_DEV_SECRET_KEY;
const BRAND_SEARCH_ENDPOINT = "https://api.logo.dev/search";
const REQUEST_TIMEOUT_MS = 6000;

type LogoDevSuggestion = {
  name: string;
  domain: string;
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

async function fetchSuggestions(query: string, signal: AbortSignal): Promise<LogoDevSuggestion[]> {
  if (!LOGO_DEV_SECRET_KEY) {
    throw new Error("Logo.dev secret key missing");
  }

  const url = new URL(BRAND_SEARCH_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("strategy", "suggest");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${LOGO_DEV_SECRET_KEY}`,
      "User-Agent": "InspectOS-Agency-Lookup",
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Brand search failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as LogoDevSuggestion[];
}

function normalizeResult(suggestion: LogoDevSuggestion, fallbackId: string): AgencyLookupResult {
  const domain = suggestion.domain?.trim() || null;
  const website = domain ? `https://${domain}` : null;

  return {
    id: domain ?? fallbackId,
    name: suggestion.name,
    domain,
    logoUrl: resolveLogoUrl({ domain, website }, { size: 96 }),
    website,
    email: null,
    phone: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    source: "logo-dev",
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const suggestions = await fetchSuggestions(query, controller.signal);
    if (suggestions.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const limited = suggestions.slice(0, 5);
    const results = limited.map((suggestion, index) => normalizeResult(suggestion, `${suggestion.name}-${index}`));

    return NextResponse.json({ data: results, meta: { brandSearchEnabled: Boolean(LOGO_DEV_SECRET_KEY) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search agencies";
    console.error("Agency lookup error", message);
    const status = message.includes("aborted") ? 504 : 500;
    return NextResponse.json({ error: { message: "Unable to search agencies right now." } }, { status });
  } finally {
    clearTimeout(timeout);
  }
}
