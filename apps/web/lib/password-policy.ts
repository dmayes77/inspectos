const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /[0-9]/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

export type PasswordRequirement = {
  key: "length" | "uppercase" | "number" | "special";
  label: string;
  met: boolean;
};

export function getPasswordPolicyChecks(password: string): PasswordRequirement[] {
  return [
    {
      key: "length",
      label: "At least 10 characters",
      met: password.length >= 10,
    },
    {
      key: "uppercase",
      label: "At least 1 uppercase letter",
      met: UPPERCASE_REGEX.test(password),
    },
    {
      key: "number",
      label: "At least 1 number",
      met: NUMBER_REGEX.test(password),
    },
    {
      key: "special",
      label: "At least 1 special character (e.g. !)",
      met: SPECIAL_CHAR_REGEX.test(password),
    },
  ];
}

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
