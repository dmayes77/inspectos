import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient } from "@/lib/supabase";

type ResendBody = {
  email?: string;
  email_redirect_to?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ResendBody;
  const email = body.email?.trim();
  const emailRedirectTo = body.email_redirect_to?.trim() || undefined;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseHost = (() => {
    try {
      return supabaseUrl ? new URL(supabaseUrl).host : "missing";
    } catch {
      return "invalid";
    }
  })();

  console.info("[api:auth:resend] incoming", {
    email,
    hasEmailRedirectTo: Boolean(emailRedirectTo),
    emailRedirectTo: emailRedirectTo ?? null,
    supabaseHost,
  });

  if (!email) {
    return badRequest("Email is required.");
  }

  const supabase = createAnonClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    console.warn("[api:auth:resend] resend failed", {
      message: error.message,
      status: (error as { status?: number }).status ?? null,
      supabaseHost,
    });
    return NextResponse.json(
      {
        success: false,
        error: { code: "RESEND_FAILED", message: error.message },
      },
      { status: (error as { status?: number }).status ?? 400 }
    );
  }

  console.info("[api:auth:resend] resend success", {
    email,
    supabaseHost,
  });

  return NextResponse.json({ success: true, data: { sent: true } });
}
