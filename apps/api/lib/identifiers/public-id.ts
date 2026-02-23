const PUBLIC_ID_REGEX = /^[A-HJ-NP-Z2-9]{10}$/;

export function isValidPublicId(value: string): boolean {
  return PUBLIC_ID_REGEX.test(value);
}

