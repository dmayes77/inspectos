import { NextResponse } from "next/server";
import { requirePermission, withAuth } from "@/lib/api/with-auth";

const BUCKET_NAME = "branding";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

const defaultSettings = {
  company: {
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  },
  branding: {
    logoUrl: null as string | null,
    primaryColor: "#f97316",
  },
  notifications: {
    newBooking: true,
    inspectionComplete: true,
    paymentReceived: true,
    reportViewed: false,
    weeklySummary: true,
  },
};

type TenantSettings = typeof defaultSettings;

function buildSettings(currentSettings: Partial<TenantSettings>, logoUrl: string | null): TenantSettings {
  return {
    company: { ...defaultSettings.company, ...currentSettings.company },
    branding: { ...defaultSettings.branding, ...currentSettings.branding, logoUrl },
    notifications: { ...defaultSettings.notifications, ...currentSettings.notifications },
  };
}

export const POST = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions, request }) => {
  const permissionCheck = requirePermission(
    memberRole,
    "edit_branding",
    "You do not have permission to update branding",
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const tenantId = tenant.id;

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
  const { data: existingFiles } = await serviceClient.storage
    .from(BUCKET_NAME)
    .list(tenantId, { limit: 100, search: "logo-" });

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${tenantId}/${f.name}`);
    await serviceClient.storage.from(BUCKET_NAME).remove(filesToDelete);
  }

  // Upload new logo
  const { error: uploadError } = await serviceClient.storage
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
  const { data: publicUrlData } = serviceClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  const logoUrl = publicUrlData.publicUrl;

  // Update tenant settings with new logo URL
  const { data: current, error: currentError } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (currentError || !current) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const currentSettings = (current?.settings as Partial<TenantSettings>) || {};
  const newSettings = buildSettings(currentSettings, logoUrl);

  const { error: updateError } = await serviceClient
    .from("tenants")
    .update({ settings: newSettings })
    .eq("id", tenantId);

  if (updateError) {
    console.error("Settings update error:", updateError);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ logoUrl });
});

export const DELETE = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions }) => {
  const permissionCheck = requirePermission(
    memberRole,
    "edit_branding",
    "You do not have permission to update branding",
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const tenantId = tenant.id;

  // Delete all logos for this tenant
  const { data: existingFiles } = await serviceClient.storage
    .from(BUCKET_NAME)
    .list(tenantId, { limit: 100, search: "logo-" });

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${tenantId}/${f.name}`);
    await serviceClient.storage.from(BUCKET_NAME).remove(filesToDelete);
  }

  // Clear logo URL from settings
  const { data: current, error: currentError } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (currentError || !current) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const currentSettings = (current?.settings as Partial<TenantSettings>) || {};
  const newSettings = buildSettings(currentSettings, null);

  const { error: updateError } = await serviceClient
    .from("tenants")
    .update({ settings: newSettings })
    .eq("id", tenantId);

  if (updateError) {
    console.error("Settings update error:", updateError);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
