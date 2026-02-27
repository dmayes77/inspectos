function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function toSlugIdSegment(label: string | null | undefined, identifier: string) {
  const slug = slugify(label ?? "");
  return slug ? `${slug}--${identifier}` : identifier;
}

export function parseSlugIdSegment(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  const separatorIndex = normalized.lastIndexOf("--");
  if (separatorIndex > 0 && separatorIndex < normalized.length - 2) {
    return normalized.slice(separatorIndex + 2);
  }
  return normalized;
}
