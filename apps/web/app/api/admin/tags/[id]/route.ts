import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateTagSchema } from "@/lib/validations/tag";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, updateTagSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("tags")
    .update({
      name: payload.name,
      scope: payload.scope,
      tag_type: payload.tagType ?? "custom",
      description: payload.description ?? null,
      color: payload.color ?? null,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id, name, scope, tag_type, description, color, is_active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update tag." }, { status: 500 });
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("tags")
    .update({ is_active: false })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to delete tag." }, { status: 500 });
  }

  return NextResponse.json(true);
}
