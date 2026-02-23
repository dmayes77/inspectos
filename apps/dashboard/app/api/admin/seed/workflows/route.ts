import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

type SeedWorkflow = {
  name: string;
  description: string;
  triggerScope: string;
  triggerType: string;
  triggerTagName?: string;
  delayMinutes: number;
  actions: Record<string, unknown>[];
  systemKey: string;
};

export async function POST() {
  const tenantId = getTenantId();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("workflows")
    .select("system_key")
    .eq("tenant_id", tenantId);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingKeys = new Set((existing ?? []).map((row) => row.system_key).filter(Boolean));

  const { data: tags } = await supabaseAdmin
    .from("tags")
    .select("id, name, scope")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const tagByName = new Map(
    (tags ?? []).map((tag) => [`${tag.scope}:${tag.name}`.toLowerCase(), tag.id])
  );

  const seedWorkflows: SeedWorkflow[] = [
    {
      name: "Lead Welcome Email",
      description: "Send an intro email when a new lead tag is added.",
      triggerScope: "lead",
      triggerType: "tag_added",
      triggerTagName: "New",
      delayMinutes: 0,
      actions: [{ type: "send_email", config: { templateKey: "lead_welcome" } }],
      systemKey: "lead_welcome_email",
    },
    {
      name: "Inspection Scheduled Email",
      description: "Notify client when inspection is scheduled.",
      triggerScope: "inspection",
      triggerType: "tag_added",
      triggerTagName: "Scheduled",
      delayMinutes: 0,
      actions: [{ type: "send_email", config: { templateKey: "inspection_scheduled" } }],
      systemKey: "inspection_scheduled_email",
    },
    {
      name: "Invoice Sent Email",
      description: "Email client when invoice is sent.",
      triggerScope: "invoice",
      triggerType: "tag_added",
      triggerTagName: "Sent",
      delayMinutes: 0,
      actions: [{ type: "send_email", config: { templateKey: "invoice_sent" } }],
      systemKey: "invoice_sent_email",
    },
  ];

  const toInsert = seedWorkflows.filter((workflow) => !existingKeys.has(workflow.systemKey));

  if (toInsert.length === 0) {
    return NextResponse.json({ message: "Workflows already seeded." });
  }

  const { error: insertError } = await supabaseAdmin.from("workflows").insert(
    toInsert.map((workflow) => {
      const tagId = workflow.triggerTagName
        ? tagByName.get(`${workflow.triggerScope}:${workflow.triggerTagName}`.toLowerCase()) ?? null
        : null;
      return {
        tenant_id: tenantId,
        name: workflow.name,
        description: workflow.description,
        trigger_scope: workflow.triggerScope,
        trigger_type: workflow.triggerType,
        trigger_tag_id: tagId,
        actions: workflow.actions,
        delay_minutes: workflow.delayMinutes,
        is_active: true,
        is_system: true,
        system_key: workflow.systemKey,
      };
    })
  );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Seeded ${toInsert.length} workflows.` });
}
