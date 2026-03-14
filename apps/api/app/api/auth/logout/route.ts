import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies, readSessionTokensFromCookies } from "@/lib/auth/session-cookies";
import { createAnonClient } from "@/lib/supabase";
import { applyCorsHeaders, buildCorsPreflightResponse } from "@/lib/cors";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") ?? null;
  const { accessToken, refreshToken } = readSessionTokensFromCookies(request);

  if (accessToken && refreshToken) {
    try {
      const supabase = createAnonClient();
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      await supabase.auth.signOut();
    } catch {
      // Best-effort only; clear cookies either way.
    }
  }

  const response = NextResponse.json({ success: true, data: { loggedOut: true } });
  return applyCorsHeaders(clearSessionCookies(response, { origin }), request);
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, "POST, OPTIONS");
}
