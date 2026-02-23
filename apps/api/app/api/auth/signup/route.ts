import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";

type SignupBody = {
  email?: string;
  password?: string;
  full_name?: string;
  email_redirect_to?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SignupBody;
  const email = body.email?.trim();
  const password = body.password;
  const fullName = body.full_name?.trim();
  const emailRedirectTo = body.email_redirect_to?.trim();

  if (!email || !password || !fullName) {
    return badRequest("Email, password, and full name are required.");
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: emailRedirectTo || undefined,
    },
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SIGNUP_FAILED",
          message: error.message,
        },
      },
      { status: (error as { status?: number }).status ?? 400 }
    );
  }

  const response = NextResponse.json({
    success: true,
    data: {
      requires_email_confirmation: !data.session,
      user: {
        id: data.user?.id ?? null,
        email: data.user?.email ?? null,
      },
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
