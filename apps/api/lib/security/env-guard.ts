const PROD_NODE_ENV = "production";

function isTrue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "true";
}

export function assertNoProdAuthBypass(): void {
  const isProduction =
    process.env.NODE_ENV === PROD_NODE_ENV ||
    process.env.VERCEL_ENV === PROD_NODE_ENV;

  if (!isProduction) return;

  const bypassFlags = [
    "BYPASS_AUTH",
    "NEXT_PUBLIC_BYPASS_AUTH",
    "VITE_BYPASS_AUTH",
  ] as const;

  for (const flag of bypassFlags) {
    if (isTrue(process.env[flag])) {
      throw new Error(`Security misconfiguration: ${flag}=true is forbidden in production.`);
    }
  }
}
