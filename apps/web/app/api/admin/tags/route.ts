import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createTagSchema } from "@/lib/validations/tag";

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("tags")
    .select("id, name, scope, tag_type, description, color, is_active")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("scope")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      scope: tag.scope,
      tagType: tag.tag_type,
      description: tag.description ?? undefined,
      color: tag.color ?? null,
      isActive: tag.is_active,
    }))
  );
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createTagSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("tags")
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      scope: payload.scope,
      tag_type: payload.tagType ?? "custom",
      description: payload.description ?? null,
      color: payload.color ?? null,
      is_active: true,
    })
    .select("id, name, scope, tag_type, description, color, is_active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create tag." }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    scope: data.scope,
    tagType: data.tag_type,
    description: data.description ?? undefined,
    color: data.color ?? null,
    isActive: data.is_active,
  });
}
