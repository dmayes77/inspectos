import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient, unauthorized } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return badRequest("Email and password are required.");
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return unauthorized(error?.message || "Invalid email or password.");
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
