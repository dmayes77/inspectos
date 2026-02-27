const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractIdentifierFromRouteSegment(value: string) {
  const trimmed = value.trim();
  const separatorIndex = trimmed.lastIndexOf("--");
  if (separatorIndex > 0 && separatorIndex < trimmed.length - 2) {
    return trimmed.slice(separatorIndex + 2);
  }
  return trimmed;
}

export function parseRouteIdentifier(value: string) {
  return extractIdentifierFromRouteSegment(value);
}

export function resolveIdLookup(
  value: string,
  options?: {
    publicColumn?: string;
    transformPublicValue?: (id: string) => string;
  }
) {
  const identifier = extractIdentifierFromRouteSegment(value);
  if (UUID_REGEX.test(identifier)) {
    return { column: "id", value: identifier };
  }

  const publicColumn = options?.publicColumn ?? "public_id";
  const transformed = options?.transformPublicValue
    ? options.transformPublicValue(identifier)
    : identifier.toUpperCase();
  return { column: publicColumn, value: transformed };
}
