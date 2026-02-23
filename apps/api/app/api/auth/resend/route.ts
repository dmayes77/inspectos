import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient } from "@/lib/supabase";

type ResendBody = {
  email?: string;
  email_redirect_to?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ResendBody;
  const email = body.email?.trim();

  if (!email) {
    return badRequest("Email is required.");
  }

  const supabase = createAnonClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: body.email_redirect_to?.trim() || undefined,
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
