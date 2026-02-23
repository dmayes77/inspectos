import { badRequest, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

type ScrubBody = {
  url?: string;
  excludePhotos?: string[];
};

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

/**
 * POST /api/admin/agents/scrub
 * Returns a normalized payload for the agent/agency importer.
 * Placeholder implementation until full scraper integration is wired.
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
  const photoCandidates: string[] = [];

  return success({
    url: inputUrl,
    domain,
    name: getNameFromPath(parsed.pathname),
    role: null,
    email: null,
    phone: null,
    licenseNumbers: [],
    photoUrl: null,
    photoCandidates: photoCandidates.filter((photo) => !excluded.has(photo)),
    logoUrl: null,
    agencyName: getAgencyNameFromDomain(domain),
    agencyAddress: null,
  });
});
