import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient } from "@/lib/supabase";

type ForgotPasswordBody = {
  email?: string;
  redirect_to?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ForgotPasswordBody;
  const email = body.email?.trim();

  if (!email) {
    return badRequest("Email is required.");
  }

  const supabase = createAnonClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: body.redirect_to?.trim() || undefined,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "RESET_REQUEST_FAILED", message: error.message },
      },
      { status: (error as { status?: number }).status ?? 400 }
    );
  }

  return NextResponse.json({ success: true, data: { sent: true } });
}
