/**
 * Normalize user-provided phone input into a canonical E.164-like format.
 *
 * Rules:
 * - Empty/invalid values -> null
 * - `+<country><number>` is preserved when digit length is plausible (8-15)
 * - 10-digit numbers default to US country code +1
 * - 11-digit numbers starting with 1 are treated as US (+1)
 * - Other 8-15 digit inputs are stored with a leading +
 */
export function normalizePhoneForStorage(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutExtension = trimmed.replace(/\s*(?:ext\.?|extension|x)\s*\d+.*$/i, '');
  const hasLeadingPlus = withoutExtension.startsWith('+');
  const digits = withoutExtension.replace(/\D/g, '');
  if (!digits) return null;

  if (hasLeadingPlus) {
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}
