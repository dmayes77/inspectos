import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";

type ExchangeCodeBody = {
  code?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ExchangeCodeBody;
  const code = body.code?.trim();
  if (!code) {
    return badRequest("code is required.");
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.json(
      { success: false, error: { code: "EXCHANGE_FAILED", message: error?.message || "Invalid code" } },
      { status: (error as { status?: number }).status ?? 400 }
    );
  }

  const response = NextResponse.json({
    success: true,
    data: {
      user: {
        id: data.user?.id ?? null,
        email: data.user?.email ?? null,
      },
    },
  });

  return setSessionCookies(response, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
}
