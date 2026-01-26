import { NextResponse } from "next/server";
import { logoDevUrl } from "@/lib/utils/logos";
import type { AgentScrubResult } from "@/types/agent-scrub";

const REQUEST_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 900_000;
const USER_AGENT = "InspectOS-Agent-Scrub/1.0";
const COLDWELL_DOMAINS = ["coldwellbanker.com", "coldwellbankerhomes.com"];
const AGENCY_DOMAIN_LABELS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /coldwellbanker/i, label: "Coldwell Banker" },
  { pattern: /kw\./i, label: "Keller Williams" },
  { pattern: /kellerwilliams/i, label: "Keller Williams" },
  { pattern: /compass/i, label: "Compass" },
  { pattern: /remax/i, label: "RE/MAX" },
  { pattern: /sotheby/i, label: "Sotheby's International Realty" },
  { pattern: /exp(realty)?/i, label: "eXp Realty" },
  { pattern: /bhhs/i, label: "Berkshire Hathaway HomeServices" },
  { pattern: /c21|century21/i, label: "Century 21" },
  { pattern: /corcoran/i, label: "Corcoran" },
];

export async function POST(request: Request) {
  let targetUrl: string | null = null;
  try {
    const payload = await request.json();
    targetUrl = typeof payload?.url === "string" ? payload.url.trim() : null;
  } catch (error) {
    return NextResponse.json({ error: { message: "Invalid request body" } }, { status: 400 });
  }

  if (!targetUrl) {
    return NextResponse.json({ error: { message: "Provide a profile URL to scrub." } }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Unsupported protocol");
    }
  } catch (error) {
    return NextResponse.json({ error: { message: "Enter a valid http(s) URL." } }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json({ error: { message: `Unable to reach ${parsedUrl.hostname}` } }, { status: 502 });
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const bodyHtml = extractBodyContent(html);
    const textContent = collapseWhitespace(stripTags(stripNoise(bodyHtml)));

    const domainAgencyName = deriveAgencyNameFromHost(parsedUrl.hostname);
    const agencyName = cleanAgencyLabel(domainAgencyName, domainAgencyName);
    const rawName = pickFirst([
      extractTagText(bodyHtml, ["h1", "h2"]),
      extractAgentNameFromText(textContent),
      extractMetaContent(html, ["profile:first_name", "og:title", "twitter:title"]),
      extractTitle(html),
    ]);
    const result: AgentScrubResult = {
      url: parsedUrl.toString(),
      domain: parsedUrl.hostname,
      name: sanitizeName(rawName, agencyName, parsedUrl.hostname),
      role: extractRole(bodyHtml, textContent),
      email: extractEmail(bodyHtml) ?? extractEmail(textContent),
      phone: extractPhone(textContent),
      licenseNumbers: extractLicenses(textContent),
      photoUrl: extractProfileImage(bodyHtml, parsedUrl),
      logoUrl: logoDevUrl(parsedUrl.hostname, { size: 96 }),
      agencyName,
      agencyAddress: null,
    };

    if (!result.name) {
      const labeledAgent = extractAgentNameFromText(textContent);
      if (labeledAgent) {
        result.name = sanitizeName(labeledAgent, result.agencyName ?? agencyName, parsedUrl.hostname);
      }
    }

    const structuredData = extractAgencyFromJsonLd(html);
    if (structuredData) {
      if (structuredData.agencyAddress) {
        result.agencyAddress = structuredData.agencyAddress;
      }
      if (!result.phone && structuredData.phone) {
        result.phone = structuredData.phone;
      }
      if (!result.email && structuredData.email) {
        result.email = structuredData.email;
      }
      if (!result.photoUrl && structuredData.photoUrl) {
        const resolvedPhoto = resolveUrl(structuredData.photoUrl, parsedUrl) ?? structuredData.photoUrl;
        if (isAllowedImageUrl(resolvedPhoto)) {
          result.photoUrl = resolvedPhoto;
        }
      }
    }

    const squarespace = extractSquarespaceContext(html);
    if (squarespace) {
      if (squarespace.agencyAddress) {
        result.agencyAddress = squarespace.agencyAddress;
      }
      if (!result.phone && squarespace.phone) {
        result.phone = squarespace.phone;
      }
      if (!result.email && squarespace.email) {
        result.email = squarespace.email;
      }
    }

    if (isColdwellDomain(parsedUrl.hostname)) {
      const coldwell = extractColdwellBankerData(html);
      if (coldwell) {
        if (coldwell.name) {
          result.name = sanitizeName(coldwell.name, result.agencyName ?? agencyName, parsedUrl.hostname);
        }
        if (!result.role && coldwell.role) {
          const cleaned = sanitizeRole(coldwell.role);
          if (cleaned) {
            result.role = cleaned;
          }
        }
        if (coldwell.email) {
          result.email = coldwell.email;
        }
        if (coldwell.phone) {
          result.phone = coldwell.phone;
        }
        if (coldwell.photoUrl && isAllowedImageUrl(coldwell.photoUrl)) {
          result.photoUrl = coldwell.photoUrl;
        }
        if (coldwell.licenseNumbers?.length) {
          const merged = new Set([...result.licenseNumbers, ...coldwell.licenseNumbers]);
          result.licenseNumbers = Array.from(merged);
        }
      }
    }

    if (!result.agencyAddress) {
      const fallbackAddress = extractAddressFromHtml(bodyHtml) ?? extractAddressFromText(textContent);
      if (fallbackAddress) {
        result.agencyAddress = fallbackAddress;
      }
    }

    if ((!result.agencyName || isSameLabel(result.agencyName, result.name)) && domainAgencyName) {
      result.agencyName = domainAgencyName;
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "The website took too long to respond." : "Unable to scrub that profile right now.";
    const status = error instanceof Error && error.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ error: { message } }, { status });
  } finally {
    clearTimeout(timeout);
  }
}

function stripNoise(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function extractBodyContent(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match?.[1] ?? html;
}

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, " ");
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
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .trim();
}

function extractMetaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const regex = new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`, "gi");
    let match;
    let candidate: string | null = null;
    while ((match = regex.exec(html))) {
      const content = match[0].match(/content=["']([^"']+)["']/i);
      if (content?.[1]) {
        candidate = decodeHtml(content[1]);
      }
    }
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

function extractTagText(html: string, tags: string[]) {
  for (const tag of tags) {
    const regex = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, "i");
    const match = html.match(regex);
    if (match?.[1]) {
      const text = collapseWhitespace(stripTags(match[1]));
      if (text) {
        return decodeHtml(text);
      }
    }
  }
  return null;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  const text = collapseWhitespace(match[1]);
  return text ? decodeHtml(text) : null;
}

function extractEmail(source: string | null) {
  if (!source) return null;
  const mailto = source.match(/mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  if (mailto?.[1]) return mailto[1].toLowerCase();
  const regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const match = source.match(regex);
  return match?.[0]?.toLowerCase() ?? null;
}

function extractPhone(source: string | null) {
  if (!source) return null;
  const tel = source.match(/tel:([+\d][0-9().\-\s]{7,})/i);
  if (tel?.[1]) return collapseWhitespace(tel[1]);
  const regex = /([+\d][0-9().\-\s]{7,})/g;
  let match;
  while ((match = regex.exec(source))) {
    const candidate = collapseWhitespace(match[1]);
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 16) {
      return candidate;
    }
  }
  return null;
}

function extractLicenses(source: string | null) {
  if (!source) return [];
  const regex = /(?:license|licensing|lic\.?|dre)\s*(?:#|no\.?|number)?\s*[:\-]?\s*([A-Z0-9\-]+)/gi;
  const values = new Set<string>();
  let match;
  while ((match = regex.exec(source))) {
    const raw = match[1]?.replace(/[^A-Z0-9\-]/gi, "");
    if (!raw) continue;
    if (!/\d/.test(raw)) continue;
    if (raw.length < 3) continue;
    values.add(raw.toUpperCase());
  }
  return Array.from(values);
}

function extractProfileImage(html: string, baseUrl: URL) {
  const keywordPattern = "(?:headshot|profile|avatar|agent|photo|portrait|team|broker|realtor|img-overlay|hero|author|staff)";
  const targeted = new RegExp(`<img[^>]+(?:class|alt)=["'][^"']*${keywordPattern}[^"']*["'][^>]*>`, "gi");
  let match;
  while ((match = targeted.exec(html))) {
    const resolved = extractImageFromTag(match[0], baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  const backgroundTargeted = new RegExp(
    `<(?:div|figure|section|span)[^>]+(?:class|id)=["'][^"']*${keywordPattern}[^"']*["'][^>]*(?:style\\s*=\\s*["'][^"']*url\([^)]+\)[^"']*["']|data-[^=]*(?:bg|image|img|src|lazy)[^=]*=\\s*["'][^"']+["'])[^>]*>`,
    "gi",
  );
  while ((match = backgroundTargeted.exec(html))) {
    const resolved = extractImageFromTag(match[0], baseUrl);
    if (resolved) {
      return resolved;
    }
  }

  const metaImage = extractMetaContent(html, ["og:image", "twitter:image", "image"]);
  if (metaImage) {
    const resolved = resolveUrl(metaImage, baseUrl) ?? metaImage;
    if (isAllowedImageUrl(resolved)) {
      return resolved;
    }
  }

  const generic = html.match(/<img[^>]*>/gi);
  if (generic) {
    for (const tag of generic) {
      const resolved = extractImageFromTag(tag, baseUrl);
      if (resolved) {
        return resolved;
      }
    }
  }

  const backgroundGeneric = html.match(/<(?:div|figure|section|span)[^>]+style=["'][^"']*url\([^)]+\)[^"']*["'][^>]*>/gi);
  if (backgroundGeneric) {
    for (const tag of backgroundGeneric) {
      const resolved = extractImageFromTag(tag, baseUrl);
      if (resolved) {
        return resolved;
      }
    }
  }
  return null;
}

function extractImageFromTag(tag: string, baseUrl: URL) {
  const attributes = [
    pickFromSrcset(getAttribute(tag, "data-srcset")),
    pickFromSrcset(getAttribute(tag, "srcset")),
    normalizeImageAttribute(getAttribute(tag, "data-flickity-lazyload")),
    normalizeImageAttribute(getAttribute(tag, "data-lazy-src")),
    normalizeImageAttribute(getAttribute(tag, "data-src")),
    normalizeImageAttribute(getAttribute(tag, "data-original")),
    normalizeImageAttribute(getAttribute(tag, "data-img")),
    normalizeImageAttribute(getAttribute(tag, "data-image")),
    normalizeImageAttribute(getAttribute(tag, "data-bg")),
    normalizeImageAttribute(getAttribute(tag, "data-background-image")),
    extractBackgroundFromStyle(tag),
    normalizeImageAttribute(getAttribute(tag, "src")),
  ];

  for (const candidate of attributes) {
    if (!candidate) continue;
    const resolved = resolveUrl(candidate, baseUrl);
    if (isAllowedImageUrl(resolved)) {
      return resolved;
    }
  }
  return null;
}

function getAttribute(tag: string, name: string) {
  const normalized = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const doubleMatch = tag.match(new RegExp(`${normalized}\\s*=\\s*"([^"]+)"`, "i"));
  if (doubleMatch?.[1]) {
    return doubleMatch[1].trim();
  }
  const singleMatch = tag.match(new RegExp(`${normalized}\\s*=\\s*'([^']+)'`, "i"));
  if (singleMatch?.[1]) {
    return singleMatch[1].trim();
  }
  return null;
}

function normalizeImageAttribute(value: string | null) {
  if (!value) return null;
  const decoded = decodeHtml(value).trim();
  if (!decoded) return null;
  const unwrapped = decoded.replace(/^url\((.*)\)$/i, "$1").replace(/^['"]|['"]$/g, "");
  return unwrapped.trim();
}

function pickFromSrcset(value: string | null) {
  if (!value) return null;
  const decoded = decodeHtml(value);
  const entries = decoded
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!entries.length) return null;
  let best: { url: string; weight: number } | null = null;
  for (const entry of entries) {
    const [url, descriptor] = entry.split(/\s+/);
    if (!url) continue;
    const cleanUrl = normalizeImageAttribute(url);
    if (!cleanUrl) continue;
    const widthMatch = descriptor?.match(/(\d+)/);
    const width = widthMatch ? Number(widthMatch[1]) : 0;
    if (!best || width >= best.weight) {
      best = { url: cleanUrl, weight: width };
    }
  }
  return best?.url ?? null;
}

function extractBackgroundFromStyle(tag: string) {
  const styleMatch = tag.match(/style=["'][^"']*background[^"']*url\(([^)]+)\)[^"']*["']/i);
  if (styleMatch?.[1]) {
    return normalizeImageAttribute(styleMatch[1]);
  }
  return null;
}

function resolveUrl(value: string, base: URL) {
  try {
    if (value.startsWith("//")) {
      return `${base.protocol}${value}`;
    }
    if (value.startsWith("http")) {
      return value;
    }
    const resolved = new URL(value, base);
    return resolved.toString();
  } catch (error) {
    return value;
  }
}

function extractRole(html: string, textContent: string) {
  const candidates = [extractRoleFromJsonLd(html), extractRoleFromItemprop(html), extractRoleFromClass(html), extractRoleFromLabeledText(textContent)];

  for (const candidate of candidates) {
    const cleaned = sanitizeRole(candidate);
    if (cleaned) {
      return cleaned;
    }
  }
  return null;
}

function extractRoleFromJsonLd(html: string) {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html))) {
    const json = match[1];
    try {
      const data = JSON.parse(json.trim());
      const found = findJobTitle(data);
      if (found) {
        return found;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function findJobTitle(node: unknown): string | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const value of node) {
      const found = findJobTitle(value);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    const record = node as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const value = record[key];
      if (typeof value === "string" && /(job|role|position)/i.test(key)) {
        return value;
      }
      const nested = findJobTitle(value);
      if (nested) return nested;
    }
  }
  return null;
}

function extractRoleFromItemprop(html: string) {
  const regex = /<[^>]+itemprop=["']jobTitle["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const text = collapseWhitespace(stripTags(match[1] ?? ""));
    if (text) {
      return decodeHtml(text);
    }
  }
  return null;
}

function extractRoleFromClass(html: string) {
  const regex =
    /<[^>]+class=["'][^"']*(?:job[-_ ]?title|agent[-_ ]?title|job[-_ ]?role|agent[-_ ]?role|header[-_ ]?info[-_ ]?title|team[-_ ]?(?:lead|leader|manager)|position)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const text = collapseWhitespace(stripTags(match[1] ?? ""));
    if (text) {
      return decodeHtml(text);
    }
  }
  return null;
}

function extractRoleFromLabeledText(text: string) {
  if (!text) return null;
  const regex = /(?:title|role|position)\s*(?:is|\b)?\s*[:\-]\s*([A-Za-z0-9&(),.\s]{2,80})/gi;
  let match;
  while ((match = regex.exec(text))) {
    const candidate = match[1]?.trim();
    if (candidate) {
      return candidate;
    }
  }
  return null;
}

function sanitizeRole(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = collapseWhitespace(stripTags(value))
    .replace(/^[\-–—\s]+/, "")
    .replace(/[\-–—\s]+$/, "");
  if (!cleaned) return null;
  if (/https?:\/\//i.test(cleaned)) return null;
  if (/[{}<>]/.test(cleaned)) return null;
  if (/\b(function|var|let|const|return|window|document)\b/i.test(cleaned)) return null;
  if (cleaned.length > 120) {
    return cleaned.slice(0, 120).trim();
  }
  return cleaned;
}

function sanitizeName(value: string | null | undefined, agencyName?: string | null, domain?: string) {
  if (!value) return null;
  const cleaned = collapseWhitespace(stripTags(value));
  if (!cleaned) return null;

  const parts = cleaned.split(/\s*(?:—|–|-|\||•|›)\s*/).filter(Boolean);
  if (parts.length >= 2) {
    const suffix = parts.slice(1).join(" ");
    if (isAgencyLike(suffix, agencyName, domain)) {
      return parts[0];
    }
  }
  return cleaned;
}

function isAgencyLike(value: string, agencyName?: string | null, domain?: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (agencyName && normalized === agencyName.trim().toLowerCase()) return true;
  if (domain) {
    const withoutWww = domain.replace(/^www\./i, "");
    const domainLabel = withoutWww.split(".")[0];
    if (domainLabel && normalized.includes(domainLabel.toLowerCase())) {
      return true;
    }
  }
  if (/(realty|homes?|properties|estate|company|group|brokerage|real estate|inc\.?|llc|kw|compass|re\/max|coldwell|sotheby|exp|agency)/i.test(value)) {
    return true;
  }
  return false;
}

function pickFirst(values: Array<string | null | undefined>) {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function deriveAgencyNameFromHost(hostname: string | null | undefined) {
  if (!hostname) return null;
  for (const entry of AGENCY_DOMAIN_LABELS) {
    if (entry.pattern.test(hostname)) {
      return entry.label;
    }
  }
  const withoutWww = hostname.replace(/^www\./i, "");
  const labels = withoutWww.split(".").filter(Boolean);
  if (!labels.length) return null;
  const tld = labels[labels.length - 1];
  let base = labels.length >= 2 ? labels[labels.length - 2] : labels[0];
  if (base && base.length <= 3 && labels.length >= 3) {
    base = labels[labels.length - 3];
  }
  if (!base || base.length < 3) {
    base = labels[0];
  }
  const words = base.split(/[-_]/).filter(Boolean);
  const titled = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  if (titled) {
    return titled;
  }
  if (base) {
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return tld?.toUpperCase() ?? null;
}

function cleanAgencyLabel(label: string | null | undefined, fallback?: string | null) {
  if (!label) {
    return fallback ?? null;
  }
  let value = decodeHtml(label)
    .trim()
    .replace(/\s{2,}/g, " ");
  if (!value) {
    return fallback ?? null;
  }
  const separators = ["|", "•", "·", "-", "–", "—", "/"];
  if (value.length > 80) {
    for (const separator of separators) {
      if (value.includes(separator)) {
        const first = value.split(separator)[0]?.trim();
        if (first && first.length >= 3) {
          value = first;
          break;
        }
      }
    }
    if (value.length > 80 && fallback) {
      return fallback;
    }
  } else {
    for (const separator of separators) {
      if (value.includes(separator)) {
        const first = value.split(separator)[0]?.trim();
        if (first && first.length >= 3) {
          value = first;
          break;
        }
      }
    }
  }
  return value || fallback || null;
}

function normalizeComparableText(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function isSameLabel(a: string | null | undefined, b: string | null | undefined) {
  const normalizedA = normalizeComparableText(a);
  const normalizedB = normalizeComparableText(b);
  if (!normalizedA || !normalizedB) return false;
  return normalizedA === normalizedB;
}

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".jepg", ".png", ".webp"];

const AGENT_LABELS = ["agent name", "agent", "realtor", "broker", "team lead", "lead agent", "contact name"];

function isAllowedImageUrl(value: string | null | undefined) {
  if (!value) return false;
  const withoutQuery = value.split(/[?#]/)[0]?.toLowerCase();
  if (!withoutQuery) return false;
  return ALLOWED_IMAGE_EXTENSIONS.some((ext) => withoutQuery.endsWith(ext));
}

function extractAgentNameFromText(text: string | null) {
  return extractLabeledValue(text, AGENT_LABELS);
}

function extractLabeledValue(source: string | null, labels: string[]) {
  if (!source) return null;
  const pattern = labels
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"))
    .join("|");
  if (!pattern) return null;
  const regex = new RegExp(`(?:^|[\s>])(?:${pattern})(?:\s+(?:name|info|information))?\s*(?:is|:|=|-|–|—)\s*([A-Za-z0-9.,&'()\/#-\s]{2,160})`, "i");
  const match = source.match(regex);
  if (!match?.[1]) return null;
  const cleaned = match[1].trim().replace(/\s{2,}/g, " ");
  return cleaned.length ? cleaned : null;
}

function isColdwellDomain(hostname: string) {
  return COLDWELL_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

type ColdwellAgentData = Partial<Pick<AgentScrubResult, "name" | "role" | "email" | "phone" | "photoUrl" | "agencyName">> & {
  licenseNumbers?: string[];
};

function extractColdwellBankerData(html: string): ColdwellAgentData | null {
  const scriptMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch?.[1]) return null;
  try {
    const payload = JSON.parse(scriptMatch[1].trim());
    const detail = payload?.props?.pageProps?.detail;
    const agent = detail?.agentDetails;
    if (!agent || typeof agent !== "object") return null;

    const primaryOffice = agent.primaryOffice ?? (Array.isArray(detail?.offices) ? detail.offices[0] : detail?.offices) ?? null;

    const officeJobTitle = findTitleDescription(primaryOffice?.jobTitles);
    const agentJobTitle = findTitleDescription(agent.jobTitles);

    const officePhone = findContactValue(primaryOffice?.phoneNumbers, "phoneNumber");
    const officeEmail = findContactValue(primaryOffice?.emailAccounts, "emailAddress");

    const licenses: Array<string | null> = [];
    if (Array.isArray(agent.licenses)) {
      for (const license of agent.licenses) {
        if (license?.licenseNumber) {
          licenses.push(String(license.licenseNumber));
        }
      }
    }
    if (Array.isArray(primaryOffice?.licenses)) {
      for (const license of primaryOffice.licenses) {
        if (license?.licenseNumber) {
          licenses.push(String(license.licenseNumber));
        }
      }
    }

    const licenseNumbers = Array.from(
      new Set(
        licenses
          .map((license) => license?.trim())
          .filter((license): license is string => Boolean(license))
          .map((license) => license.toUpperCase()),
      ),
    );

    const photoUrl = pickFirst([getMediaUrl(agent.media), getMediaUrl(primaryOffice?.media)]);

    const phone = pickFirst([agent.businessPhoneNumber, agent.cellPhoneNumber, officePhone]);

    return {
      name: pickFirst([agent.fullName, agent.preferredFirstName, agent.agentTitleAndMeta?.name]),
      agencyName: pickFirst([primaryOffice?.doingBusinessAs, agent.brokerageCompanyName, primaryOffice?.officeName]),
      role: pickFirst([officeJobTitle, agentJobTitle, agent.agentTitleAndMeta?.titleDescription]),
      email: pickFirst([agent.emailAccount, officeEmail])?.toLowerCase() ?? null,
      phone: phone ? collapseWhitespace(phone) : null,
      photoUrl,
      licenseNumbers,
    };
  } catch (error) {
    return null;
  }
}

function getMediaUrl(media: unknown): string | null {
  if (!media) return null;
  if (Array.isArray(media)) {
    for (const entry of media) {
      const found = getMediaUrl(entry);
      if (found) return found;
    }
    return null;
  }
  if (typeof media === "object") {
    const record = media as Record<string, unknown>;
    if (typeof record.cdnURL === "string") return record.cdnURL;
    if (typeof record.url === "string") return record.url;
  }
  return null;
}

function findTitleDescription(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const candidate = record.titleDescription;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return null;
}

function findContactValue(value: unknown, field: "phoneNumber" | "emailAddress"): string | null {
  if (!Array.isArray(value)) return null;
  const records = value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");
  const prioritized = records.find((record) => record.isPrimary === true);
  if (prioritized) {
    const candidate = prioritized[field];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  for (const record of records) {
    const candidate = record[field];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return null;
}

type SquarespaceContextData = {
  agencyName: string | null;
  agencyAddress: string | null;
  phone: string | null;
  email: string | null;
};

function extractSquarespaceContext(html: string): SquarespaceContextData | null {
  const jsonBlock = extractJsonBlock(html, "Static.SQUARESPACE_CONTEXT");
  if (!jsonBlock) return null;
  try {
    const payload = JSON.parse(jsonBlock);
    const website = payload?.website;
    const websiteSettings = payload?.websiteSettings;

    const agencyName = pickFirst([
      typeof website?.siteTitle === "string" ? website.siteTitle : null,
      typeof website?.fullSiteTitle === "string" ? website.fullSiteTitle : null,
      typeof website?.location?.addressTitle === "string" ? website.location.addressTitle : null,
    ]);

    const agencyAddress = normalizeSquarespaceAddress(website?.location);

    const phone = typeof websiteSettings?.contactPhoneNumber === "string" ? collapseWhitespace(websiteSettings.contactPhoneNumber) : null;

    const email =
      typeof websiteSettings?.contactEmail === "string" && websiteSettings.contactEmail.trim().length > 0
        ? websiteSettings.contactEmail.trim().toLowerCase()
        : null;

    return {
      agencyName: agencyName ?? null,
      agencyAddress,
      phone,
      email,
    };
  } catch (error) {
    return null;
  }
}

function normalizeSquarespaceAddress(location: unknown): string | null {
  if (!location || typeof location !== "object") return null;
  const record = location as Record<string, unknown>;
  const parts: string[] = [];

  const pushPart = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        parts.push(trimmed);
      }
    }
  };

  pushPart(record.addressLine1);
  pushPart(record.addressLine2);

  if (typeof record.addressCountry === "string") {
    const trimmedCountry = record.addressCountry.trim();
    if (trimmedCountry && !parts.some((part) => part.toLowerCase().includes(trimmedCountry.toLowerCase()))) {
      parts.push(trimmedCountry);
    }
  }

  return parts.length ? parts.join(", ") : null;
}

function extractJsonBlock(html: string, marker: string) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return null;
  const start = html.indexOf("{", markerIndex);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < html.length; index += 1) {
    const char = html[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return html.slice(start, index + 1);
      }
    }
  }

  return null;
}

type JsonLdAgencyData = {
  agencyName: string | null;
  agencyAddress: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
};

function extractAgencyFromJsonLd(html: string): JsonLdAgencyData | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const candidates: JsonLdAgencyData[] = [];
  let match;
  while ((match = scriptRegex.exec(html))) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const sanitized = raw.replace(/<!--|-->/g, "");
    try {
      const data = JSON.parse(sanitized);
      collectAgencyNodes(data, candidates);
    } catch (error) {
      continue;
    }
  }

  if (!candidates.length) return null;
  return candidates.find((entry) => entry.agencyAddress) ?? candidates[0];
}

const AGENCY_NODE_TYPES = [
  "realestateagent",
  "organization",
  "localbusiness",
  "realestateoffice",
  "realestateorganization",
  "realestatecompany",
  "brokerage",
  "person",
];

function collectAgencyNodes(node: unknown, bucket: JsonLdAgencyData[]) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const value of node) {
      collectAgencyNodes(value, bucket);
    }
    return;
  }

  if (typeof node === "object") {
    const record = node as Record<string, unknown>;
    const types = normalizeTypeArray(record["@type"]);
    if (types.some((type) => AGENCY_NODE_TYPES.includes(type))) {
      const contact = collectContactDetails(record);
      const candidate: JsonLdAgencyData = {
        agencyName: extractPlainText(record.name),
        agencyAddress: formatPostalAddress(record.address),
        phone: contact.phone,
        email: contact.email,
        photoUrl: extractImageValue(record.image),
      };
      if (candidate.agencyName || candidate.agencyAddress || candidate.phone || candidate.email) {
        bucket.push(candidate);
      }
    }

    for (const value of Object.values(record)) {
      collectAgencyNodes(value, bucket);
    }
  }
}

function normalizeTypeArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => (typeof entry === "string" ? entry.toLowerCase() : null)).filter((entry): entry is string => Boolean(entry));
  }
  if (typeof value === "string") {
    return [value.toLowerCase()];
  }
  return [];
}

function extractPlainText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = collapseWhitespace(stripTags(value));
  return text || null;
}

function formatPostalAddress(value: unknown): string | null {
  if (!value) return null;
  const addresses = Array.isArray(value) ? value : [value];
  for (const entry of addresses) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of ["streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry"]) {
      const text = extractPlainText(record[key]);
      if (text) {
        parts.push(text);
      }
    }
    if (parts.length) {
      return parts.join(", ");
    }
  }
  return null;
}

function collectContactDetails(record: Record<string, unknown>) {
  const phone = pickFirst([
    extractPlainText(record.telephone),
    extractPlainText(record.phone),
    extractPlainText(record.phoneNumber),
    extractPlainText(record.telephoneNumber),
    extractFromContactPoints(record.contactPoint, "telephone"),
    extractFromContactPoints(record.contactPoint, "phone"),
    extractFromContactPoints(record.contactPoints, "telephone"),
    extractFromContactPoints(record.contactPoints, "phone"),
  ]);

  const email = pickFirst([
    typeof record.email === "string" ? record.email.trim().toLowerCase() : null,
    extractFromContactPoints(record.contactPoint, "email"),
    extractFromContactPoints(record.contactPoints, "email"),
  ]);

  return {
    phone: phone ? collapseWhitespace(phone) : null,
    email: email ?? null,
  };
}

function extractImageValue(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractImageValue(entry);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [record.url, record.contentUrl, record["@id"], record.thumbnailUrl];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }
  return null;
}

function extractFromContactPoints(value: unknown, field: "telephone" | "phone" | "email") {
  if (!value) return null;
  const entries = Array.isArray(value) ? value : [value];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const candidate = record[field];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function extractAddressFromHtml(html: string) {
  const addressTag = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
  if (addressTag?.[1]) {
    const text = collapseWhitespace(stripTags(addressTag[1] ?? ""));
    if (isLikelyAddress(text)) {
      return text;
    }
  }

  const iconBlock = html.match(/<i[^>]+class=["'][^"']*(?:location|pin|map)[^"']*["'][^>]*><\/i>\s*<span[^>]*>([\s\S]{0,200})<\/span>/i);
  if (iconBlock?.[1]) {
    const text = collapseWhitespace(stripTags(iconBlock[1] ?? ""));
    if (isLikelyAddress(text)) {
      return text;
    }
  }

  const spanBlock = html.match(/<span[^>]+class=["'][^"']*(?:address|office)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  if (spanBlock?.[1]) {
    const text = collapseWhitespace(stripTags(spanBlock[1] ?? ""));
    if (isLikelyAddress(text)) {
      return text;
    }
  }

  return null;
}

function extractAddressFromText(text: string) {
  if (!text) return null;
  const regexes = [
    /(\d{3,6}\s+[A-Za-z0-9.#&'’\- ]+,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)/,
    /(\d{3,6}\s+[A-Za-z0-9.#&'’\- ]+\s+[A-Za-z .'-]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)/,
  ];

  for (const regex of regexes) {
    const match = text.match(regex);
    if (match?.[1]) {
      const candidate = collapseWhitespace(match[1]);
      if (isLikelyAddress(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function isLikelyAddress(value: string | null | undefined) {
  if (!value) return false;
  if (!/\d{3,}/.test(value)) return false;
  if (!/[A-Z]{2}\s*\d{5}/.test(value)) return false;
  return true;
}
