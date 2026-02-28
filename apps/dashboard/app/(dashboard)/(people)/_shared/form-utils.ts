import { logoDevUrl } from "@inspectos/shared/utils/logos";

export const normalize = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeWebsite = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!sanitized) return null;
  return `https://${sanitized}`;
};

export const websiteFromDomain = (domain?: string | null) => normalizeWebsite(domain) ?? "";

export const mergeField = (next?: string | null, current?: string) => {
  const trimmed = next?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return current ?? "";
};

export const resolveLogoForSubmit = (logoUrl?: string | null, website?: string | null) => {
  const normalizedLogo = normalize(logoUrl ?? "");
  if (normalizedLogo) return normalizedLogo;
  return logoDevUrl(website ?? null, { size: 96 });
};

export type ParsedAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export const parseScrubbedAddress = (value?: string | null): ParsedAddress | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const normalizeAddressInput = (raw: string) => {
    let normalized = raw.replace(/\s+/g, " ").trim();
    normalized = normalized.replace(/^(?:hours?|office|address|location)\b[:\s-]*/i, "").trim();

    // If scrape noise prefixes the address, start from the first street-looking segment.
    const streetStart = normalized.match(
      /\b\d{1,6}\s+[A-Za-z0-9#.'-]+(?:\s+[A-Za-z0-9#.'-]+){0,5}\s+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|pkwy|parkway|ct|court|pl|place|ter|terrace|cir|circle|hwy|highway)\b/i
    );
    if (streetStart?.index !== undefined && streetStart.index > 0) {
      normalized = normalized.slice(streetStart.index).trim();
    }

    return normalized;
  };

  const normalizedInput = normalizeAddressInput(trimmed);
  const tokens = normalizedInput
    .split(/\r?\n+/)
    .flatMap((line) => line.split(","))
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return null;

  const remaining = [...tokens];
  let addressLine1 = remaining.shift() ?? "";
  let zipCode: string | undefined;
  let state: string | undefined;
  let city: string | undefined;

  const isCountryToken = (token: string) => {
    const cleaned = token.replace(/\.+/g, "").trim();
    if (!cleaned) return false;
    const normalizedToken = cleaned.replace(/[^a-z]/gi, "").toLowerCase();
    const countries = new Set(["us", "usa", "unitedstates", "unitedstatesofamerica"]);
    if (countries.has(normalizedToken)) return true;
    if (/\d/.test(cleaned)) return false;
    return /^[A-Za-z]{2}$/.test(cleaned);
  };

  const extractCityStateZip = (source: string) => {
    const match = source.match(/^(.*?)(?:,\s*)?([A-Za-z .'-]+)\s*,?\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (!match) return null;
    const [, street, cityPart, statePart, zipPart] = match;
    return {
      street: street.trim(),
      city: cityPart.trim(),
      state: statePart.toUpperCase(),
      zip: zipPart,
    };
  };

  while (remaining.length > 0 && isCountryToken(remaining[remaining.length - 1])) {
    remaining.pop();
  }

  if (remaining.length > 0) {
    const last = remaining[remaining.length - 1];
    let working = last;
    const zipMatch = working.match(/\b\d{5}(?:-\d{4})?\b/);
    if (zipMatch) {
      zipCode = zipMatch[0];
      working = working.replace(zipMatch[0], "").trim();
    }
    const stateMatch = working.match(/\b[A-Za-z]{2}\b/);
    if (stateMatch) {
      state = stateMatch[0].toUpperCase();
      working = working.replace(stateMatch[0], "").replace(/,\s*$/, "").trim();
    }
    if (working) {
      remaining[remaining.length - 1] = working;
    } else {
      remaining.pop();
    }
  }

  if (!state && remaining.length > 0) {
    const last = remaining[remaining.length - 1];
    if (/^[A-Za-z]{2}$/.test(last)) {
      state = last.toUpperCase();
      remaining.pop();
    }
  }

  if (!zipCode && remaining.length > 0) {
    const last = remaining[remaining.length - 1];
    if (/^\d{5}(?:-\d{4})?$/.test(last)) {
      zipCode = last;
      remaining.pop();
    }
  }

  if (remaining.length > 0) {
    city = remaining.pop() ?? undefined;
  }

  const addressLine2 = remaining.length > 0 ? remaining.join(", ") : undefined;

  const applyFallback = () => {
    if (!addressLine1) return;
    const fallback = extractCityStateZip(addressLine1) ?? extractCityStateZip(normalizedInput);
    if (!fallback) return;
    if (fallback.street) {
      addressLine1 = fallback.street;
    }
    if (!city && fallback.city) {
      city = fallback.city;
    }
    if (!state && fallback.state) {
      state = fallback.state;
    }
    if (!zipCode && fallback.zip) {
      zipCode = fallback.zip;
    }
  };

  if (!city || !state || !zipCode) {
    applyFallback();
  }

  return {
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
  };
};

export const buildAgencyAddress = (values: {
  agencyAddressLine1?: string;
  agencyAddressLine2?: string;
  agencyCity?: string;
  agencyState?: string;
  agencyZipCode?: string;
}) => {
  const segments: string[] = [];
  if (values.agencyAddressLine1?.trim()) {
    segments.push(values.agencyAddressLine1.trim());
  }
  if (values.agencyAddressLine2?.trim()) {
    segments.push(values.agencyAddressLine2.trim());
  }
  const cityState = [values.agencyCity?.trim(), values.agencyState?.trim()].filter(Boolean).join(", ");
  const locality = [cityState, values.agencyZipCode?.trim()].filter(Boolean).join(" ").trim();
  if (locality) {
    segments.push(locality);
  }
  return segments.length > 0 ? segments.join(", ") : null;
};
