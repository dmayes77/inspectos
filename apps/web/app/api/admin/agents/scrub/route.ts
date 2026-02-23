import { NextRequest, NextResponse } from "next/server";
import { logoDevUrl } from "@inspectos/shared/utils/logos";

type ScrubBody = {
  url?: string;
  excludePhotos?: string[];
};

const REQUEST_TIMEOUT_MS = 10000;
const MAX_HTML_BYTES = 1_000_000;
const USER_AGENT = "InspectOS-Agent-Scrub/1.0";

function toTitleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getNameFromPath(pathname: string) {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1);
  if (!lastSegment) return null;
  const normalized = lastSegment.replace(/\.(html|htm|php)$/i, "");
  if (!normalized || normalized.length < 2) return null;
  return toTitleCase(normalized);
}

function getAgencyNameFromDomain(domain: string) {
  const firstLabel = domain.split(".")[0] ?? "";
  if (!firstLabel) return null;
  return toTitleCase(firstLabel);
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function stripNoise(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, " ");
}

function extractBodyContent(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match?.[1] ?? html;
}

function extractMetaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const regex = new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`, "gi");
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
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) {
      return collapseWhitespace(candidate);
    }
  }
  return null;
}

function extractRole(source: string) {
  const lowered = source.toLowerCase();
  if (/(realtor|real estate agent|listing agent)/i.test(lowered)) return "Realtor";
  if (/(broker|associate broker)/i.test(lowered)) return "Broker";
  if (/(team lead|team leader)/i.test(lowered)) return "Team Lead";
  return null;
}

function extractLicenses(source: string) {
  const matches = source.match(/\b(?:licen(?:se|sed)|license#?)[:\s-]*([A-Z0-9-]{4,})/gi) ?? [];
  const normalized = matches
    .map((m) => m.replace(/^.*?:\s*/i, "").trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function resolveUrl(raw: string, baseUrl: URL) {
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractPhotoCandidates(html: string, baseUrl: URL) {
  const results: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html))) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const resolved = resolveUrl(raw, baseUrl);
    if (!resolved) continue;
    if (!/^https?:\/\//i.test(resolved)) continue;
    if (!/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(resolved)) continue;
    results.push(resolved);
  }
  return Array.from(new Set(results)).slice(0, 20);
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
  return labeled ? collapseWhitespace(labeled) : null;
}

export async function POST(request: NextRequest) {
  let body: ScrubBody = {};
  try {
    body = (await request.json()) as ScrubBody;
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid request body." } },
      { status: 400 }
    );
  }

  const inputUrl = body.url?.trim();
  if (!inputUrl) {
    return NextResponse.json(
      { error: { message: "URL is required." } },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return NextResponse.json(
      { error: { message: "Enter a valid URL." } },
      { status: 400 }
    );
  }

  const domain = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const excluded = new Set((body.excludePhotos ?? []).filter(Boolean));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: `Unable to reach ${domain}` } },
        { status: 502 }
      );
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const bodyHtml = extractBodyContent(html);
    const textContent = collapseWhitespace(stripTags(stripNoise(bodyHtml)));

    const candidateName =
      extractMetaContent(html, ["profile:first_name", "og:title", "twitter:title"]) ??
      extractTitle(html) ??
      getNameFromPath(parsed.pathname);
    const agencyName =
      extractMetaContent(html, ["og:site_name", "application-name"]) ??
      getAgencyNameFromDomain(domain);
    const photoCandidates = extractPhotoCandidates(bodyHtml, parsed).filter((photo) => !excluded.has(photo));
    const photoUrl = pickLikelyHeadshot(photoCandidates);
    const logoUrl = logoDevUrl(domain, { size: 96 }) ?? null;

    return NextResponse.json({
      data: {
        url: inputUrl,
        domain,
        name: candidateName,
        role: extractRole(textContent),
        email: extractEmail(`${html}\n${textContent}`),
        phone: extractPhone(`${html}\n${textContent}`),
        licenseNumbers: extractLicenses(textContent),
        photoUrl,
        photoCandidates,
        logoUrl,
        agencyName,
        agencyAddress: extractAgencyAddress(bodyHtml, textContent),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "The website took too long to respond."
        : "Unable to scrub that profile right now.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
