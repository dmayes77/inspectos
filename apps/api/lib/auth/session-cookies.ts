import { NextRequest, NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "inspectos_access_token";
export const REFRESH_COOKIE_NAME = "inspectos_refresh_token";

const ACCESS_COOKIE_TTL_SECONDS = 60 * 60;
const REFRESH_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function cookieDomain(): string | undefined {
  if (!isProduction()) return undefined;
  return ".inspectos.co";
}

function isMobileAppOrigin(origin: string | null | undefined): boolean {
  return origin === "capacitor://localhost" || origin === "ionic://localhost";
}

function resolveSameSite(origin: string | null | undefined): "lax" | "none" {
  return isMobileAppOrigin(origin) ? "none" : "lax";
}

function cookieBaseOptions(origin?: string | null) {
  return {
    httpOnly: true as const,
    sameSite: resolveSameSite(origin),
    secure: isProduction(),
    path: "/",
    domain: cookieDomain(),
  };
}

export function readSessionTokensFromCookies(request: NextRequest): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  return {
    accessToken: request.cookies.get(ACCESS_COOKIE_NAME)?.value ?? null,
    refreshToken: request.cookies.get(REFRESH_COOKIE_NAME)?.value ?? null,
  };
}

export function setSessionCookies(
  response: NextResponse,
  tokens: { accessToken?: string | null; refreshToken?: string | null },
  options?: { origin?: string | null }
): NextResponse {
  if (tokens.accessToken) {
    response.cookies.set(ACCESS_COOKIE_NAME, tokens.accessToken, {
      ...cookieBaseOptions(options?.origin),
      maxAge: ACCESS_COOKIE_TTL_SECONDS,
    });
  }

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      ...cookieBaseOptions(options?.origin),
      maxAge: REFRESH_COOKIE_TTL_SECONDS,
    });
  }

  return response;
}

export function clearSessionCookies(response: NextResponse, options?: { origin?: string | null }): NextResponse {
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    ...cookieBaseOptions(options?.origin),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    ...cookieBaseOptions(options?.origin),
    maxAge: 0,
  });
  return response;
}
