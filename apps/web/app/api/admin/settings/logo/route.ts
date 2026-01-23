import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { defaultSettings, type TenantSettings } from "@/lib/data/settings";

const BUCKET_NAME = "branding";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

export async function POST(request: NextRequest) {
  const tenantId = getTenantId();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PNG, JPEG, GIF, WebP, SVG" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 2MB" },
      { status: 400 }
    );
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "png";
  const filename = `${tenantId}/logo-${Date.now()}.${ext}`;

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Delete existing logo if present
  const { data: existingFiles } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(tenantId, { limit: 100, search: "logo-" });

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${tenantId}/${f.name}`);
    await supabaseAdmin.storage.from(BUCKET_NAME).remove(filesToDelete);
  }

  // Upload new logo
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Logo upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }

  // Get public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  const logoUrl = publicUrlData.publicUrl;

  // Update tenant settings with new logo URL
  const { data: current } = await supabaseAdmin
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .single();

  const currentSettings = (current?.settings as Partial<TenantSettings>) || {};
  const newSettings: TenantSettings = {
    company: { ...defaultSettings.company, ...currentSettings.company },
    branding: { ...defaultSettings.branding, ...currentSettings.branding, logoUrl },
    notifications: { ...defaultSettings.notifications, ...currentSettings.notifications },
  };

  const { error: updateError } = await supabaseAdmin
    .from("tenants")
    .update({ settings: newSettings })
    .eq("id", tenantId);

  if (updateError) {
    console.error("Settings update error:", updateError);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ logoUrl });
}

export async function DELETE() {
  const tenantId = getTenantId();

  // Delete all logos for this tenant
  const { data: existingFiles } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(tenantId, { limit: 100, search: "logo-" });

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${tenantId}/${f.name}`);
    await supabaseAdmin.storage.from(BUCKET_NAME).remove(filesToDelete);
  }

  // Clear logo URL from settings
  const { data: current } = await supabaseAdmin
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .single();

  const currentSettings = (current?.settings as Partial<TenantSettings>) || {};
  const newSettings: TenantSettings = {
    company: { ...defaultSettings.company, ...currentSettings.company },
    branding: { ...defaultSettings.branding, ...currentSettings.branding, logoUrl: null },
    notifications: { ...defaultSettings.notifications, ...currentSettings.notifications },
  };

  const { error: updateError } = await supabaseAdmin
    .from("tenants")
    .update({ settings: newSettings })
    .eq("id", tenantId);

  if (updateError) {
    console.error("Settings update error:", updateError);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
