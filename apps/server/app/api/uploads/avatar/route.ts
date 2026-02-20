import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createUserClient, forbidden, getAccessToken, unauthorized } from "@/lib/supabase";
import { RateLimitPresets, rateLimitByIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimitByIP(request, RateLimitPresets.expensive);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return unauthorized("Missing access token");
  }

  const supabaseUser = createUserClient(accessToken);
  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  const authenticatedUserId = authData?.user?.id ?? null;

  if (authError || !authenticatedUserId) {
    return unauthorized("Invalid access token");
  }

  const payload = await request.json();
  const avatarUrl = typeof payload?.avatarUrl === "string" ? payload.avatarUrl : null;
  const userId = typeof payload?.userId === "string" ? payload.userId : authenticatedUserId;

  if (!avatarUrl) {
    return NextResponse.json({ error: { message: "avatarUrl is required" } }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: { message: "userId is required" } }, { status: 400 });
  }

  if (userId !== authenticatedUserId) {
    return forbidden("You can only update your own avatar");
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
