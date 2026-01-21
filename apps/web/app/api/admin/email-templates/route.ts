import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createEmailTemplateSchema } from "@/lib/validations/email-template";

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .select("id, name, subject, body, category, description, is_system")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category ?? null,
      description: template.description ?? null,
      isSystem: template.is_system,
    }))
  );
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createEmailTemplateSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      subject: payload.subject,
      body: payload.body,
      category: payload.category ?? null,
      description: payload.description ?? null,
      is_system: false,
    })
    .select("id, name, subject, body, category, description, is_system")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create template." }, { status: 500 });
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
