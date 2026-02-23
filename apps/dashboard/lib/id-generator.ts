/**
 * Generates human-readable, cryptographically random IDs
 *
 * Uses UUID v4 as entropy source, converted to base-32 (Crockford alphabet)
 * to create collision-resistant, URL-safe identifiers.
 *
 * Default format: XXXX-XXXX (8 chars, grouped by 4, dash separator)
 * Example: "A3G7-K9M2"
 */

type IdConfig = {
  /** Total length of ID characters (excluding separators). Default: 8 */
  length?: number;
  /** Number of characters per group. Default: 4 */
  groupSize?: number;
  /** Character to separate groups. Default: "-" */
  separator?: string;
  /** Character set for encoding. Default: Crockford Base32 (no ambiguous chars) */
  charset?: string;
};

// Crockford Base32: excludes I, L, O, U to avoid confusion with 1, 1, 0, V
const DEFAULT_CHARSET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generate a unique, human-readable ID
 *
 * @param config - Optional configuration for ID format
 * @returns Formatted ID string (e.g., "ABCD-1234")
 *
 * @example
 * generateReadableId() // "A3G7-K9M2"
 * generateReadableId({ length: 10, groupSize: 5 }) // "A3G7K-9M2N4"
 * generateReadableId({ separator: '_' }) // "A3G7_K9M2"
 */
export function generateReadableId(config?: IdConfig): string {
  const {
    length = 8,
    groupSize = 4,
    separator = '-',
    charset = DEFAULT_CHARSET,
  } = config || {};

  // 1. Generate UUID for cryptographic entropy
  const uuid = crypto.randomUUID();

  // 2. Remove non-alphanumeric characters (hyphens)
  const cleaned = uuid.replace(/-/g, '');

  // 3. Convert hex UUID to BigInt
  const num = BigInt('0x' + cleaned);

  // 4. Encode to custom charset (similar to base conversion)
  let encoded = '';
  let remaining = num;
  const base = BigInt(charset.length);

  while (encoded.length < length && remaining > BigInt(0)) {
    const idx = Number(remaining % base);
    encoded = charset[idx] + encoded;
    remaining = remaining / base;
  }

  // Pad with first charset character if needed
  while (encoded.length < length) {
    encoded = charset[0] + encoded;
  }

  // 5. Take required length
  encoded = encoded.slice(0, length);

  // 6. Format with separator into groups
  if (groupSize <= 0 || groupSize >= length) {
    return encoded;
  }

  const groups: string[] = [];
  for (let i = 0; i < encoded.length; i += groupSize) {
    groups.push(encoded.slice(i, i + groupSize));
  }

  return groups.join(separator);
}
