import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";

type SignupBody = {
  email?: string;
  password?: string;
  full_name?: string;
};

function inferRedirectBaseUrl(request: NextRequest): string {
  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    try {
      const parsed = new URL(origin);
      const host = parsed.host.toLowerCase();
      const isLocalhost = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
      const isInspectos = host === "inspectos.co" || host.endsWith(".inspectos.co");
      if (isLocalhost || isInspectos) {
        return `${parsed.protocol}//${parsed.host}`;
      }
    } catch {
      // ignore malformed origin
    }
  }

  const configured =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3001";

  return configured.replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SignupBody;
  const email = body.email?.trim();
  const password = body.password;
  const fullName = body.full_name?.trim();
  const emailRedirectTo = `${inferRedirectBaseUrl(request)}/auth/callback?next=%2Fwelcome`;

  if (!email || !password || !fullName) {
    return badRequest("Email, password, and full name are required.");
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo,
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
