import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { badRequest, createAnonClient } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";

type ConfirmBody = {
  token_hash?: string;
  type?: EmailOtpType;
};

function isAllowedWebHost(host: string): boolean {
  const normalizedHost = host.toLowerCase();
  const isLocalhost =
    normalizedHost.startsWith("localhost:") ||
    normalizedHost === "localhost" ||
    normalizedHost.startsWith("127.0.0.1:") ||
    normalizedHost === "127.0.0.1";

  if (isLocalhost) return true;

  const isInspectos = normalizedHost === "inspectos.co" || normalizedHost.endsWith(".inspectos.co");
  if (!isInspectos) return false;

  const isApiSubdomain =
    normalizedHost === "api.inspectos.co" ||
    normalizedHost.startsWith("api.") ||
    normalizedHost.startsWith("dev-api.") ||
    normalizedHost.includes(".api.");

  return !isApiSubdomain;
}

function readTrustedBaseUrl(candidate: string | null): string | null {
  const value = candidate?.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!isAllowedWebHost(parsed.host)) return null;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function getWebBaseUrl(request: NextRequest): string {
  const fromOrigin = readTrustedBaseUrl(request.headers.get("origin"));
  if (fromOrigin) return fromOrigin;

  const referer = request.headers.get("referer");
  const fromReferer = readTrustedBaseUrl(referer);
  if (fromReferer) return fromReferer;

  const configured = readTrustedBaseUrl(
    process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || null
  );
  if (configured) return configured;

  return "http://localhost:3001";
}

function getSafeRedirectPath(nextParam: string | null, fallback: string): string {
  if (!nextParam) return fallback;
  if (!nextParam.startsWith("/")) return fallback;
  if (nextParam.startsWith("//")) return fallback;
  return nextParam;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash")?.trim();
  const type = request.nextUrl.searchParams.get("type")?.trim() as EmailOtpType | null;
  const next = request.nextUrl.searchParams.get("next");
  console.info("[api:auth:confirm:get] incoming", {
    hasTokenHash: Boolean(tokenHash),
    tokenHashLength: tokenHash?.length ?? 0,
    type: type ?? null,
    next: next ?? null,
  });

  if (!tokenHash || !type) {
    console.warn("[api:auth:confirm:get] missing token/type -> login");
    const url = new URL("/login?error=missing_confirmation_token", getWebBaseUrl(request));
    return NextResponse.redirect(url, { status: 303 });
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    console.warn("[api:auth:confirm:get] verifyOtp failed", {
      message: error.message,
      status: (error as { status?: number }).status ?? null,
      type,
    });
    const url = new URL("/login?error=invalid_or_expired_confirmation", getWebBaseUrl(request));
    return NextResponse.redirect(url, { status: 303 });
  }

  const fallbackPath = type === "recovery" ? "/reset-password" : "/welcome?confirmed=1";
  const redirectPath = getSafeRedirectPath(next, fallbackPath);

  // For signup confirmations where Supabase does not issue an immediate session,
  // route through login and preserve the onboarding destination.
  if (type === "email" && !data.session) {
    console.info("[api:auth:confirm:get] verified without session -> login handoff", {
      redirectPath,
    });
    const loginUrl = new URL("/login", getWebBaseUrl(request));
    loginUrl.searchParams.set("confirmed", "1");
    loginUrl.searchParams.set("url", redirectPath);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  console.info("[api:auth:confirm:get] verified with session -> redirect", {
    redirectPath,
  });
  const redirectUrl = new URL(redirectPath, getWebBaseUrl(request));
  const response = NextResponse.redirect(redirectUrl, { status: 303 });

  if (data.session) {
    return setSessionCookies(response, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  }

  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ConfirmBody;
  const tokenHash = body.token_hash?.trim();
  const type = body.type;

  if (!tokenHash || !type) {
    return badRequest("token_hash and type are required.");
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: "CONFIRM_FAILED", message: error.message } },
      { status: (error as { status?: number }).status ?? 400 }
    );
  }

  const response = NextResponse.json({
    success: true,
    data: {
      type,
      redirect_to: type === "recovery" ? "/reset-password" : "/welcome",
    },
  });

  if (data.session) {
    return setSessionCookies(response, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  }

  return response;
}
