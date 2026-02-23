import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { badRequest, createAnonClient } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";

type ConfirmBody = {
  token_hash?: string;
  type?: EmailOtpType;
};

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
