import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const avatarUrl = typeof payload?.avatarUrl === "string" ? payload.avatarUrl : null;
  const userId = typeof payload?.userId === "string" ? payload.userId : null;

  if (!avatarUrl) {
    return NextResponse.json({ error: { message: "avatarUrl is required" } }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: { message: "userId is required" } }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId)
    .select("id, avatar_url")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: { message: error?.message ?? "Failed to update avatar." } }, { status: 500 });
  }

  return NextResponse.json({ data: { avatarUrl: data.avatar_url } });
}
