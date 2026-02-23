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

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: { message: "file is required" } }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: { message: "Only image files are allowed." } }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: { message: "Avatar file too large (max 5MB)." } }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${authenticatedUserId}/avatar-${Date.now()}.${ext || "jpg"}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: { message: uploadError.message } }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", authenticatedUserId)
      .select("id, avatar_url")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: { message: error?.message ?? "Failed to update avatar." } }, { status: 500 });
    }

    return NextResponse.json({ data: { avatarUrl: data.avatar_url } });
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
