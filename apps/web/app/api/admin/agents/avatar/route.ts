import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export const runtime = "nodejs";

const BUCKET_NAME = "agent-avatars";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const getStoragePathFromUrl = (url: string | null, tenantId: string) => {
  if (!url) return null;
  try {
    const decoded = decodeURIComponent(url);
    const marker = `${BUCKET_NAME}/`;
    const index = decoded.indexOf(marker);
    if (index === -1) return null;
    const path = decoded.slice(index + marker.length);
    return path.startsWith(`${tenantId}/`) ? path : null;
  } catch {
    return null;
  }
};

const deleteAvatarByUrl = async (url: string | null, tenantId: string) => {
  const path = getStoragePathFromUrl(url, tenantId);
  if (!path) return false;
  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([path]);
  return !error;
};

export async function POST(request: NextRequest) {
  const tenantId = getTenantId();
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const rawAgentId = (formData.get("agentId") as string | null)?.trim();
  const previousUrl = (formData.get("previousUrl") as string | null) ?? null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const safeAgentId = rawAgentId?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 36) || "agent";
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = `${tenantId}/agents/${safeAgentId}-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(filename, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    console.error("Agent avatar upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filename);
  const avatarUrl = publicUrlData.publicUrl;

  if (previousUrl) {
    await deleteAvatarByUrl(previousUrl, tenantId);
  }

  return NextResponse.json({ avatarUrl });
}

export async function DELETE(request: NextRequest) {
  const tenantId = getTenantId();
  let url: string | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = await request.json().catch(() => null);
    url = payload?.url ?? null;
  } else {
    url = request.nextUrl.searchParams.get("url");
  }

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const removed = await deleteAvatarByUrl(url, tenantId);
  if (!removed) {
    return NextResponse.json({ error: "Invalid avatar url" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
