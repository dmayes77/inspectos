import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { badRequest, createAnonClient } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";

type ConfirmBody = {
  token_hash?: string;
  type?: EmailOtpType;
};

function getWebBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3001"
  ).replace(/\/+$/, "");
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

  if (!tokenHash || !type) {
    const url = new URL("/login?error=missing_confirmation_token", getWebBaseUrl());
    return NextResponse.redirect(url, { status: 303 });
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    const url = new URL("/login?error=invalid_or_expired_confirmation", getWebBaseUrl());
    return NextResponse.redirect(url, { status: 303 });
  }

  const fallbackPath = type === "recovery" ? "/reset-password" : "/welcome?confirmed=1";
  const redirectPath = getSafeRedirectPath(next, fallbackPath);
  const redirectUrl = new URL(redirectPath, getWebBaseUrl());
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
