export const SOCIAL_FIELD_KEYS = [
  'social_facebook',
  'social_twitter',
  'social_linkedin',
  'social_instagram',
] as const;

export type SocialFieldKey = (typeof SOCIAL_FIELD_KEYS)[number];

const SOCIAL_LABEL_BY_DOMAIN: Record<string, string> = {
  'facebook.com': 'Facebook',
  'x.com': 'X',
  'twitter.com': 'X',
  'linkedin.com': 'LinkedIn',
  'lnkd.in': 'LinkedIn',
  'instagram.com': 'Instagram',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'tiktok.com': 'TikTok',
  'threads.net': 'Threads',
  'snapchat.com': 'Snapchat',
  'pinterest.com': 'Pinterest',
  'reddit.com': 'Reddit',
  'discord.com': 'Discord',
  'discord.gg': 'Discord',
};

export type SocialProfileLike = {
  social_links?: string[] | null;
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_linkedin?: string | null;
  social_instagram?: string | null;
};

export function buildSocialLinksFromProfile(profile: SocialProfileLike): string[] {
  const fromArray = Array.isArray(profile.social_links)
    ? profile.social_links.map((value) => value?.trim() ?? '').filter(Boolean)
    : [];
  if (fromArray.length > 0) {
    return fromArray;
  }

  const links = [
    profile.social_facebook,
    profile.social_twitter,
    profile.social_linkedin,
    profile.social_instagram,
  ]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean);

  return links.length > 0 ? links : [''];
}

export function applySocialLinksToPayload<T extends Record<string, unknown>>(base: T, links: string[]) {
  const sanitized = links.map((link) => link.trim()).filter(Boolean);
  const next: Record<string, unknown> = {
    ...base,
    social_links: sanitized,
  };

  for (let index = 0; index < SOCIAL_FIELD_KEYS.length; index += 1) {
    const key = SOCIAL_FIELD_KEYS[index] as SocialFieldKey;
    next[key] = sanitized[index] ?? null;
  }

  return next as T & { social_links: string[] } & Record<SocialFieldKey, string | null>;
}

export function getSocialLinkMetadata(rawUrl: string): { label: string; domain: string } | null {
  const normalized = rawUrl.trim().toLowerCase();
  if (!normalized) return null;

  const value = normalized.startsWith('http://') || normalized.startsWith('https://')
    ? normalized
    : `https://${normalized}`;

  try {
    const domain = new URL(value).hostname;
    const hostname = domain?.replace(/^www\./, '') ?? '';
    const matchedKey = Object.keys(SOCIAL_LABEL_BY_DOMAIN).find(
      (key) => hostname === key || hostname.endsWith(`.${key}`)
    );
    const label = matchedKey ? SOCIAL_LABEL_BY_DOMAIN[matchedKey] : hostname || 'Website';
    return {
      label,
      domain: hostname,
    };
  } catch {
    return {
      label: 'Link',
      domain: '',
    };
  }
}
