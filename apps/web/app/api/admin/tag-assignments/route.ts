import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { runWorkflowsForTagChange } from "@/lib/admin/workflow-runner";
import { validateRequestBody } from "@/lib/api/validate";
import {
  createTagAssignmentSchema,
  tagAssignmentDeleteSchema,
  tagAssignmentQuerySchema,
} from "@/lib/validations/tag-assignment";

const formatValidationErrors = (issues: { path: (string | number)[]; message: string }[]) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

export async function GET(request: Request) {
  const tenantId = getTenantId();
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const entityId = searchParams.get("entityId");
  const queryValidation = tagAssignmentQuerySchema.safeParse({ scope, entityId });

  if (!queryValidation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: formatValidationErrors(queryValidation.error.issues) },
      { status: 400 }
    );
  }
  const { scope: validatedScope, entityId: validatedEntityId } = queryValidation.data;

  const { data, error } = await supabaseAdmin
    .from("tag_assignments")
    .select("tag_id")
    .eq("tenant_id", tenantId)
    .eq("scope", validatedScope)
    .eq("entity_id", validatedEntityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tagIds: (data ?? []).map((row) => row.tag_id) });
}

export async function POST(request: Request) {
  const tenantId = getTenantId();
  const validation = await validateRequestBody(request, createTagAssignmentSchema);
  if (validation.error) {
    return validation.error;
  }
  const { scope, entityId, tagId } = validation.data;

  const { data: tagRow } = await supabaseAdmin
    .from("tags")
    .select("id, scope")
    .eq("tenant_id", tenantId)
    .eq("id", tagId)
    .maybeSingle();

  if (!tagRow) {
    return NextResponse.json({ error: "Tag not found for tenant." }, { status: 404 });
  }

  if (tagRow.scope !== scope) {
    return NextResponse.json({ error: "Tag scope does not match entity scope." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("tag_assignments")
    .insert({
      tenant_id: tenantId,
      scope,
      entity_id: entityId,
      tag_id: tagId,
    })
    .select("id, tag_id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to assign tag." }, { status: 500 });
  }

  await runWorkflowsForTagChange({ tenantId, scope, entityId, tagId, triggerType: "tag_added" });

  return NextResponse.json({ id: data.id, tagId: data.tag_id });
}

export async function DELETE(request: Request) {
  const tenantId = getTenantId();
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const entityId = searchParams.get("entityId");
  const tagId = searchParams.get("tagId");
  const queryValidation = tagAssignmentDeleteSchema.safeParse({ scope, entityId, tagId });

  if (!queryValidation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: formatValidationErrors(queryValidation.error.issues) },
      { status: 400 }
    );
  }
  const { scope: validatedScope, entityId: validatedEntityId, tagId: validatedTagId } =
    queryValidation.data;

  const { data: tagRow } = await supabaseAdmin
    .from("tags")
    .select("id, scope")
    .eq("tenant_id", tenantId)
    .eq("id", validatedTagId)
    .maybeSingle();

  if (!tagRow) {
    return NextResponse.json({ error: "Tag not found for tenant." }, { status: 404 });
  }

  if (tagRow.scope !== validatedScope) {
    return NextResponse.json({ error: "Tag scope does not match entity scope." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("tag_assignments")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("scope", validatedScope)
    .eq("entity_id", validatedEntityId)
    .eq("tag_id", validatedTagId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await runWorkflowsForTagChange({
    tenantId,
    scope: validatedScope,
    entityId: validatedEntityId,
    tagId: validatedTagId,
    triggerType: "tag_removed",
  });

  return NextResponse.json({ success: true });
}
