import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { defaultSettings, type TenantSettings } from "@/lib/data/settings";

export async function GET() {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("settings, name")
    .eq("id", tenantId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Merge stored settings with defaults
  const settings: TenantSettings = {
    ...defaultSettings,
    ...(data?.settings as Partial<TenantSettings> || {}),
  };

  // Use tenant name as default if company name not set
  if (!settings.company.name && data?.name) {
    settings.company.name = data.name;
  }

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const tenantId = getTenantId();
  const updates = await request.json() as Partial<TenantSettings>;

  // Get current settings
  const { data: current, error: fetchError } = await supabaseAdmin
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Deep merge settings
  const currentSettings = (current?.settings as Partial<TenantSettings>) || {};
  const newSettings: TenantSettings = {
    company: { ...defaultSettings.company, ...currentSettings.company, ...updates.company },
    branding: { ...defaultSettings.branding, ...currentSettings.branding, ...updates.branding },
    notifications: { ...defaultSettings.notifications, ...currentSettings.notifications, ...updates.notifications },
  };

  // Update tenant settings
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .update({ settings: newSettings })
    .eq("id", tenantId)
    .select("settings")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data?.settings);
}
