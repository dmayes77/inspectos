import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  readSessionTokensFromCookies,
  setSessionCookies,
} from "@/lib/auth/session-cookies";
import { createAnonClient, unauthorized } from "@/lib/supabase";

function parseJwtIssuer(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
    return typeof decoded?.iss === "string" ? decoded.iss : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { accessToken, refreshToken } = readSessionTokensFromCookies(request);
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseHost = (() => {
    try {
      return supabaseUrl ? new URL(supabaseUrl).host : "missing";
    } catch {
      return "invalid";
    }
  })();
  console.info("[api:auth:session] incoming", {
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    accessTokenIssuer: parseJwtIssuer(accessToken),
    refreshTokenLength: refreshToken?.length ?? 0,
    supabaseHost,
  });
  if (!accessToken && !refreshToken) {
    console.warn("[api:auth:session] no session cookies");
    return unauthorized("Not authenticated");
  }

  const supabase = createAnonClient();

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
      console.info("[api:auth:session] access token valid", { userId: data.user.id });
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email ?? null,
          },
        },
      });
    }
    console.warn("[api:auth:session] access token invalid", {
      message: error?.message ?? "unknown",
      status: (error as { status?: number } | null)?.status ?? null,
      accessTokenIssuer: parseJwtIssuer(accessToken),
      supabaseHost,
    });
  }

  if (!refreshToken) {
    console.warn("[api:auth:session] access invalid and no refresh token");
    const response = NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Session expired" } },
      { status: 401 }
    );
    return clearSessionCookies(response);
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (refreshError || !refreshed.session || !refreshed.user) {
    console.warn("[api:auth:session] refresh failed", {
      message: refreshError?.message ?? "unknown",
      status: (refreshError as { status?: number } | null)?.status ?? null,
    });
    const response = NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Session expired" } },
      { status: 401 }
    );
    return clearSessionCookies(response);
  }

  const response = NextResponse.json({
    success: true,
    data: {
      user: {
        id: refreshed.user.id,
        email: refreshed.user.email ?? null,
      },
    },
  });
  console.info("[api:auth:session] refresh succeeded", { userId: refreshed.user.id });

  return setSessionCookies(response, {
    accessToken: refreshed.session.access_token,
    refreshToken: refreshed.session.refresh_token,
  });
}
