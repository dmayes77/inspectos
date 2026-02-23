import { badRequest, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { logoDevUrl } from '@inspectos/shared/utils/logos';

type ScrubBody = {
  url?: string;
  excludePhotos?: string[];
  debug?: boolean;
};

const REQUEST_TIMEOUT_MS = 10000;
const MAX_HTML_BYTES = 1_000_000;
const USER_AGENT = 'InspectOS-Agent-Scrub/1.0';
const GOOGLE_PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

function toTitleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getNameFromPath(pathname: string) {
  const lastSegment = pathname.split('/').filter(Boolean).at(-1);
  if (!lastSegment) return null;
  const normalized = lastSegment.replace(/\.(html|htm|php)$/i, '');
  if (!normalized || normalized.length < 2) return null;
  return toTitleCase(normalized);
}

function getAgencyNameFromDomain(domain: string) {
  const firstLabel = domain.split('.')[0] ?? '';
  if (!firstLabel) return null;
  return toTitleCase(firstLabel);
}

function splitPersonAndAgency(raw: string | null) {
  if (!raw) return { person: null as string | null, agency: null as string | null };
  const cleaned = collapseWhitespace(raw);
  if (!cleaned) return { person: null as string | null, agency: null as string | null };

  // Split only on explicit separators, avoid splitting hyphenated names.
  const separators = [' — ', ' – ', ' | ', ' • ', ' - '];
  for (const separator of separators) {
    if (!cleaned.includes(separator)) continue;
    const [head, ...rest] = cleaned.split(separator).map((part) => part.trim()).filter(Boolean);
    if (!head) continue;
    const tail = rest.join(' ').trim();
    return { person: head, agency: tail || null };
  }

  return { person: cleaned, agency: null as string | null };
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string) {
  const decoded = value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });

  return decoded.trim();
}

function stripNoise(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
}

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, ' ');
}

function extractBodyContent(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match?.[1] ?? html;
}

function extractMetaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const regex = new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`, 'gi');
    let match;
    while ((match = regex.exec(html))) {
      const content = match[0].match(/content=["']([^"']+)["']/i)?.[1];
      if (content) return decodeHtml(collapseWhitespace(content));
    }
  }
  return null;
}

function extractTitle(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (!title) return null;
  return decodeHtml(collapseWhitespace(title));
}

function extractEmail(source: string) {
  const mailto = source.match(/mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)?.[1];
  if (mailto) return mailto.toLowerCase();
  const email = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  return email?.toLowerCase() ?? null;
}

function extractPhone(source: string) {
  const tel = source.match(/tel:([+\d][0-9().\-\s]{7,})/i)?.[1];
  if (tel) return collapseWhitespace(tel);
  const candidates = source.match(/([+\d][0-9().\-\s]{7,})/g) ?? [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      return collapseWhitespace(candidate);
    }
  }
  return null;
}

function extractRole(source: string) {
  const lowered = source.toLowerCase();
  if (/(realtor|real estate agent|listing agent)/i.test(lowered)) return 'Realtor';
  if (/(broker|associate broker)/i.test(lowered)) return 'Broker';
  if (/(team lead|team leader)/i.test(lowered)) return 'Team Lead';
  return null;
}

function extractLicenses(source: string) {
  const matches = source.match(/\b(?:licen(?:se|sed)|license#?)[:\s-]*([A-Z0-9-]{4,})/gi) ?? [];
  const normalized = matches
    .map((m) => m.replace(/^.*?:\s*/i, '').trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function resolveUrl(raw: string, baseUrl: URL) {
  try {
    const url = new URL(raw, baseUrl);
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function parseSrcSet(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function isLikelyImageUrl(url: string) {
  return (
    /\.(png|jpe?g|webp|gif|avif|bmp|svg)(\?|$)/i.test(url) ||
    /[?&](?:fm|format|image_format)=(?:png|jpe?g|webp|gif|avif|bmp|svg)\b/i.test(url) ||
    /\/(?:image|images|img|photo|photos|avatar|media)\b/i.test(url)
  );
}

function scorePhotoCandidate(url: string) {
  let score = 0;
  if (/(headshot|portrait|profile|agent|team|staff)/i.test(url)) score += 5;
  if (/(photo|image|media|cdn)/i.test(url)) score += 2;
  if (/(logo|icon|favicon|sprite|placeholder)/i.test(url)) score -= 6;
  if (/(banner|header|footer|background|hero)/i.test(url)) score -= 3;
  if (/\b(?:16|24|32|48|64|96|128)x(?:16|24|32|48|64|96|128)\b/i.test(url)) score -= 2;
  return score;
}

function extractMetaImageCandidates(html: string, baseUrl: URL) {
  const candidates: string[] = [];
  const keys = [
    'og:image',
    'og:image:url',
    'twitter:image',
    'twitter:image:src',
    'profile:image',
  ];
  for (const key of keys) {
    const value = extractMetaContent(html, [key]);
    if (!value) continue;
    const resolved = resolveUrl(value, baseUrl);
    if (!resolved) continue;
    if (!/^https?:\/\//i.test(resolved)) continue;
    if (!isLikelyImageUrl(resolved)) continue;
    candidates.push(resolved);
  }
  return candidates;
}

function extractPhotoCandidates(html: string, baseUrl: URL) {
  const results: string[] = [...extractMetaImageCandidates(html, baseUrl)];
  const imgRegex = /<img[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html))) {
    const tag = match[0];
    const directSources = [
      tag.match(/\ssrc=["']([^"']+)["']/i)?.[1],
      tag.match(/\sdata-src=["']([^"']+)["']/i)?.[1],
      tag.match(/\sdata-lazy-src=["']([^"']+)["']/i)?.[1],
      tag.match(/\sdata-original=["']([^"']+)["']/i)?.[1],
    ].filter(Boolean) as string[];
    const srcSetValues = [
      tag.match(/\ssrcset=["']([^"']+)["']/i)?.[1],
      tag.match(/\sdata-srcset=["']([^"']+)["']/i)?.[1],
    ].filter(Boolean) as string[];
    const srcSetSources = srcSetValues.flatMap(parseSrcSet);

    for (const raw of [...directSources, ...srcSetSources]) {
      const resolved = resolveUrl(raw.trim(), baseUrl);
      if (!resolved) continue;
      if (!/^https?:\/\//i.test(resolved)) continue;
      results.push(resolved);
    }
  }

  // Some themes (including Squarespace) render headshots as background images on divs.
  const tagRegex = /<([a-z0-9]+)[^>]*>/gi;
  while ((match = tagRegex.exec(html))) {
    const tag = match[0];
    const attrSources = [
      tag.match(/\sdata-bg=["']([^"']+)["']/i)?.[1],
      tag.match(/\sdata-background=["']([^"']+)["']/i)?.[1],
      tag.match(/\sdata-background-image=["']([^"']+)["']/i)?.[1],
      tag.match(/\sdata-lazy-bg=["']([^"']+)["']/i)?.[1],
    ].filter(Boolean) as string[];

    const style = tag.match(/\sstyle=["']([^"']+)["']/i)?.[1] ?? '';
    const styleUrlMatches = Array.from(style.matchAll(/url\((['"]?)(.*?)\1\)/gi))
      .map((m) => m[2])
      .filter(Boolean);

    for (const raw of [...attrSources, ...styleUrlMatches]) {
      const resolved = resolveUrl(raw.trim(), baseUrl);
      if (!resolved) continue;
      if (!/^https?:\/\//i.test(resolved)) continue;
      results.push(resolved);
    }
  }

  const unique = Array.from(new Set(results));
  unique.sort((a, b) => scorePhotoCandidate(b) - scorePhotoCandidate(a));
  return unique.slice(0, 30);
}

function pickLikelyHeadshot(candidates: string[]) {
  const preferred = candidates.find((url) =>
    /(headshot|portrait|profile|agent|team|staff)/i.test(url)
  );
  return preferred ?? candidates[0] ?? null;
}

function extractAgencyAddress(bodyHtml: string, textContent: string) {
  const addressBlock = bodyHtml.match(/<address[^>]*>([\s\S]*?)<\/address>/i)?.[1];
  if (addressBlock) return collapseWhitespace(decodeHtml(stripTags(addressBlock)));

  const labeled = textContent.match(
    /\b(?:Address|Office|Location)\b[:\s-]+([A-Za-z0-9#.,\-\s]{12,120})/i
  )?.[1];
  if (labeled) return collapseWhitespace(labeled);

  // Fallback: infer address directly from text blobs.
  const directMatch = textContent.match(
    /(\d{1,6}\s+[A-Za-z0-9#.'-]+(?:\s+[A-Za-z0-9#.'-]+){0,7}\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|pkwy|parkway|ct|court|pl|place|ter|terrace|cir|circle|hwy|highway))\s+([A-Za-z .'-]+),?\s*([A-Za-z]{2})\s*,?\s*(\d{5}(?:-\d{4})?)/i
  );
  if (directMatch) {
    const [, street, city, state, zip] = directMatch;
    return `${street.trim()}, ${city.trim()}, ${state.toUpperCase()} ${zip.trim()}`;
  }

  return null;
}

function normalizeAgencyAddress(value: string | null) {
  if (!value) return null;
  const cleaned = collapseWhitespace(
    value
      .replace(/\b(?:hours?|phone|call|contact)\b.*$/i, '')
      .replace(/\b(?:hours?|office|address|location)\b[:\s-]*/gi, '')
  );
  if (!cleaned) return null;

  const fullMatch = cleaned.match(
    /(\d{1,6}\s+[A-Za-z0-9#.'-]+(?:\s+[A-Za-z0-9#.'-]+){0,6}\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|pkwy|parkway|ct|court|pl|place|ter|terrace|cir|circle|hwy|highway))\s*,?\s*([A-Za-z .'-]+),?\s*([A-Za-z]{2})\s*,?\s*(\d{5}(?:-\d{4})?)/i
  );
  if (fullMatch) {
    const [, street, city, state, zip] = fullMatch;
    return `${street.trim()}, ${city.trim()}, ${state.toUpperCase()} ${zip.trim()}`;
  }

  const streetOnly = cleaned.match(
    /\d{1,6}\s+[A-Za-z0-9#.'-]+(?:\s+[A-Za-z0-9#.'-]+){0,6}\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|pkwy|parkway|ct|court|pl|place|ter|terrace|cir|circle|hwy|highway)\b/i
  )?.[0];
  if (streetOnly) {
    return streetOnly.trim();
  }

  return cleaned;
}

function looksLikeStreetAddress(value: string | null) {
  if (!value) return false;
  return /\b\d{1,6}\s+[A-Za-z0-9#.'-]+(?:\s+[A-Za-z0-9#.'-]+){0,6}\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|pkwy|parkway|ct|court|pl|place|ter|terrace|cir|circle|hwy|highway)\b/i.test(
    value
  );
}

function domainMatchesWebsite(domain: string, websiteUri?: string) {
  if (!domain || !websiteUri) return false;
  try {
    const host = new URL(websiteUri).hostname.replace(/^www\./i, '').toLowerCase();
    const normalizedDomain = domain.replace(/^www\./i, '').toLowerCase();
    return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`) || normalizedDomain.endsWith(`.${host}`);
  } catch {
    return false;
  }
}

type GooglePlaceResult = {
  formattedAddress?: string;
  websiteUri?: string;
};

type GoogleLookupDebug = {
  enabled: boolean;
  skipped?: string;
  query?: string;
  httpStatus?: number;
  resultCount?: number;
  matchedByWebsite?: boolean;
  selectedAddress?: string | null;
  selectedWebsite?: string | null;
  candidates?: Array<{ formattedAddress: string | null; websiteUri: string | null }>;
  error?: string;
};

type LogoDevSearchResult = {
  domain?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  website_url?: string | null;
};

async function resolveAgencyAddressFromGoogle({
  apiKey,
  agencyName,
  domain,
  debug,
}: {
  apiKey: string;
  agencyName: string | null;
  domain: string;
  debug?: boolean;
}) {
  const debugInfo: GoogleLookupDebug = { enabled: Boolean(debug) };

  const queryParts = [agencyName, domain].filter(Boolean);
  if (queryParts.length === 0) {
    if (debug) debugInfo.skipped = 'missing_query_parts';
    return { address: null, debug: debug ? debugInfo : undefined };
  }
  const query = queryParts.join(' ');
  if (debug) debugInfo.query = query;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(GOOGLE_PLACES_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.formattedAddress,places.websiteUri',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'en',
        regionCode: 'US',
        maxResultCount: 5,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (debug) debugInfo.httpStatus = response.status;

    if (!response.ok) {
      if (debug) debugInfo.error = 'google_places_http_error';
      return { address: null, debug: debug ? debugInfo : undefined };
    }

    const payload = (await response.json().catch(() => ({}))) as { places?: GooglePlaceResult[] };
    const places = payload.places ?? [];
    if (debug) {
      debugInfo.resultCount = places.length;
      debugInfo.candidates = places.map((place) => ({
        formattedAddress: place.formattedAddress ?? null,
        websiteUri: place.websiteUri ?? null,
      }));
    }
    if (places.length === 0) {
      return { address: null, debug: debug ? debugInfo : undefined };
    }

    const websiteMatch = places.find((place) => domainMatchesWebsite(domain, place.websiteUri));
    const preferred =
      websiteMatch ??
      places.find((place) => looksLikeStreetAddress(place.formattedAddress ?? null)) ??
      places[0];
    if (debug) {
      debugInfo.matchedByWebsite = Boolean(websiteMatch);
      debugInfo.selectedAddress = preferred?.formattedAddress?.trim() ?? null;
      debugInfo.selectedWebsite = preferred?.websiteUri?.trim() ?? null;
    }

    return {
      address: preferred?.formattedAddress?.trim() || null,
      debug: debug ? debugInfo : undefined,
    };
  } catch (error) {
    if (debug) debugInfo.error = error instanceof Error ? error.message : 'google_places_lookup_failed';
    return { address: null, debug: debug ? debugInfo : undefined };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeDomainForMatch(value: string | null | undefined) {
  if (!value) return null;
  return value
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .trim()
    .toLowerCase();
}

function coerceLogoDevResults(payload: unknown): LogoDevSearchResult[] {
  if (Array.isArray(payload)) return payload as LogoDevSearchResult[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as LogoDevSearchResult[];
    if (Array.isArray(obj.data)) return obj.data as LogoDevSearchResult[];
    if (Array.isArray(obj.brands)) return obj.brands as LogoDevSearchResult[];
  }
  return [];
}

async function resolveLogoUrlFromLogoDev(domain: string): Promise<string | null> {
  const logoDevKey = process.env.LOGO_DEV_SECRET_KEY?.trim() ?? '';
  if (!logoDevKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(domain)}`, {
      headers: {
        Authorization: `Bearer ${logoDevKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const payload = await response.json().catch(() => ({}));
    const results = coerceLogoDevResults(payload);
    if (results.length === 0) return null;

    const normalizedTarget = normalizeDomainForMatch(domain);
    const match =
      results.find((item) => {
        const candidateDomain =
          normalizeDomainForMatch(item.domain) ??
          normalizeDomainForMatch(item.website) ??
          normalizeDomainForMatch(item.website_url);
        return Boolean(candidateDomain && normalizedTarget && (candidateDomain === normalizedTarget || candidateDomain.endsWith(`.${normalizedTarget}`)));
      }) ?? results[0];

    return match.logo_url?.trim() || match.logoUrl?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * POST /api/admin/agents/scrub
 * Returns a normalized payload for the agent/agency importer.
 */
export const POST = withAuth(async ({ request }) => {
  let body: ScrubBody = {};
  try {
    body = (await request.json()) as ScrubBody;
  } catch {
    return badRequest('Invalid request body.');
  }

  const inputUrl = body.url?.trim();
  if (!inputUrl) {
    return badRequest('URL is required.');
  }

  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return badRequest('Enter a valid URL.');
  }

  const domain = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  const excluded = new Set((body.excludePhotos ?? []).filter(Boolean));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return badRequest(`Unable to reach ${domain}`);
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const bodyHtml = extractBodyContent(html);
    const textContent = collapseWhitespace(stripTags(stripNoise(bodyHtml)));

    const candidateName =
      extractMetaContent(html, ['profile:first_name', 'og:title', 'twitter:title']) ??
      extractTitle(html) ??
      getNameFromPath(parsed.pathname);
    const split = splitPersonAndAgency(candidateName);
    const agencyNameFromPage =
      extractMetaContent(html, ['og:site_name', 'application-name']) ??
      getAgencyNameFromDomain(domain);
    const agencyName = agencyNameFromPage ?? split.agency;
    const scrapedAgencyAddress = extractAgencyAddress(bodyHtml, textContent);
    const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY?.trim() || '';
    const debugEnabled = Boolean(body.debug);
    const googleResult = googlePlacesApiKey
      ? await resolveAgencyAddressFromGoogle({
          apiKey: googlePlacesApiKey,
          agencyName,
          domain,
          debug: debugEnabled,
        })
      : { address: null, debug: debugEnabled ? { enabled: false, skipped: 'missing_api_key' } : undefined };
    const normalizedAgencyAddress = normalizeAgencyAddress(googleResult.address);
    const photoCandidates = extractPhotoCandidates(bodyHtml, parsed).filter((photo) => !excluded.has(photo));
    const photoUrl = pickLikelyHeadshot(photoCandidates);
    const logoUrl = (await resolveLogoUrlFromLogoDev(domain)) ?? logoDevUrl(domain, { size: 96 }) ?? null;

    const responsePayload: Record<string, unknown> = {
      url: inputUrl,
      domain,
      name: split.person,
      role: extractRole(textContent),
      email: extractEmail(`${html}\n${textContent}`),
      phone: extractPhone(`${html}\n${textContent}`),
      licenseNumbers: extractLicenses(textContent),
      photoUrl,
      photoCandidates,
      logoUrl,
      agencyName,
      agencyAddress: normalizedAgencyAddress,
    };

    if (debugEnabled) {
      responsePayload.debug = {
        googlePlaces: googleResult.debug ?? { enabled: false, skipped: 'disabled' },
        scrapedAgencyAddress,
        normalizedAgencyAddress,
      };
    }

    return success(responsePayload);
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'The website took too long to respond.'
        : 'Unable to scrub that profile right now.';
    return badRequest(message);
  } finally {
    clearTimeout(timeout);
  }
});
