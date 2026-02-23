import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";

type SetSessionBody = {
  access_token?: string;
  refresh_token?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SetSessionBody;
  const accessToken = body.access_token?.trim();
  const refreshToken = body.refresh_token?.trim();

  if (!accessToken || !refreshToken) {
    return badRequest("access_token and refresh_token are required.");
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { success: false, error: { code: "SET_SESSION_FAILED", message: error?.message || "Invalid session" } },
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
