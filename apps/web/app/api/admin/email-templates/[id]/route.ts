import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateEmailTemplateSchema } from "@/lib/validations/email-template";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;
  const validation = await validateRequestBody(request, updateEmailTemplateSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .update({
      name: payload.name,
      subject: payload.subject,
      body: payload.body,
      category: payload.category ?? null,
      description: payload.description ?? null,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id, name, subject, body, category, description, is_system")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update template." }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    subject: data.subject,
    body: data.body,
    category: data.category ?? null,
    description: data.description ?? null,
    isSystem: data.is_system,
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to delete template." }, { status: 500 });
  }

  return NextResponse.json(true);
}
