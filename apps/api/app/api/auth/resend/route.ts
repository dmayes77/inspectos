import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient } from "@/lib/supabase";

type ResendBody = {
  email?: string;
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
  const body = (await request.json().catch(() => ({}))) as ResendBody;
  const email = body.email?.trim();

  if (!email) {
    return badRequest("Email is required.");
  }

  const emailRedirectTo = `${inferRedirectBaseUrl(request)}/auth/callback?next=%2Fwelcome`;

  const supabase = createAnonClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "RESEND_FAILED", message: error.message },
      },
      { status: (error as { status?: number }).status ?? 400 }
    );
  }

  return NextResponse.json({ success: true, data: { sent: true } });
}
