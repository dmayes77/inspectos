import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  readSessionTokensFromCookies,
  setSessionCookies,
} from "@/lib/auth/session-cookies";
import { createAnonClient, unauthorized } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { accessToken, refreshToken } = readSessionTokensFromCookies(request);
  if (!accessToken && !refreshToken) {
    return unauthorized("Not authenticated");
  }

  const supabase = createAnonClient();

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
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
  }

  if (!refreshToken) {
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

  return setSessionCookies(response, {
    accessToken: refreshed.session.access_token,
    refreshToken: refreshed.session.refresh_token,
  });
}
