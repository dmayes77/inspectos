import { NextRequest, NextResponse } from "next/server";
import {
  readSessionTokensFromCookies,
  setSessionCookies,
} from "@/lib/auth/session-cookies";
import { badRequest, createAnonClient, unauthorized } from "@/lib/supabase";

type ResetPasswordBody = {
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ResetPasswordBody;
  const password = body.password;

  if (!password) {
    return badRequest("password is required.");
  }

  const { accessToken, refreshToken } = readSessionTokensFromCookies(request);
  if (!accessToken || !refreshToken) {
    return unauthorized("Missing reset session.");
  }

  const supabase = createAnonClient();
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return unauthorized("Reset session is invalid or expired.");
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return NextResponse.json(
      { success: false, error: { code: "RESET_PASSWORD_FAILED", message: updateError.message } },
      { status: (updateError as { status?: number }).status ?? 400 }
    );
  }

  const { data: refreshed } = await supabase.auth.getSession();
  const response = NextResponse.json({ success: true, data: { updated: true } });

  if (refreshed.session) {
    return setSessionCookies(response, {
      accessToken: refreshed.session.access_token,
      refreshToken: refreshed.session.refresh_token,
    });
  }

  return response;
}
