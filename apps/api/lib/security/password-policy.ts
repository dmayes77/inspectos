const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /[0-9]/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 10) {
    return "Password must be at least 10 characters.";
  }
  if (!UPPERCASE_REGEX.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!NUMBER_REGEX.test(password)) {
    return "Password must include at least one number.";
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return "Password must include at least one special character (for example: !).";
  }
  return null;
}

