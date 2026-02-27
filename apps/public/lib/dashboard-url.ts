const PROD_DASHBOARD_URL = "https://app.inspectos.co";
const DEV_DASHBOARD_URL = "https://dev-app.inspectos.co";
const LOCAL_DASHBOARD_URL = "http://localhost:3001";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function inferFromHostname(hostname: string): string {
  const host = hostname.toLowerCase();

  if (host === "localhost" || host === "127.0.0.1") {
    return LOCAL_DASHBOARD_URL;
  }

  if (host.includes("vercel.app")) {
    return DEV_DASHBOARD_URL;
  }

  if (
    host === "dev.inspectos.co" ||
    host.startsWith("dev.") ||
    host.startsWith("dev-") ||
    host.includes(".dev.") ||
    host.includes(".dev-")
  ) {
    return DEV_DASHBOARD_URL;
  }

  return PROD_DASHBOARD_URL;
}

export function getDashboardBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (typeof window !== "undefined") {
    return inferFromHostname(window.location.hostname);
  }

  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase();
  if (vercelEnv === "preview") {
    return DEV_DASHBOARD_URL;
  }

  if (process.env.NODE_ENV === "development") {
    return LOCAL_DASHBOARD_URL;
  }

  return PROD_DASHBOARD_URL;
}

export function getDashboardBaseUrlFromHost(hostname: string): string {
  const configured = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  return inferFromHostname(hostname);
}

export function getDashboardAuthHref(path: "/login" | "/register"): string {
  return `${getDashboardBaseUrl()}${path}`;
}
