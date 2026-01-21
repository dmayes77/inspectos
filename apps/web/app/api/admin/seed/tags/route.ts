import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

type SeedTag = {
  name: string;
  scope: "lead" | "client" | "inspection" | "invoice" | "job" | "service" | "template";
  tag_type: "stage" | "status" | "segment" | "source" | "priority" | "custom";
  description?: string;
};

const seedTags: SeedTag[] = [
  { name: "New", scope: "lead", tag_type: "stage" },
  { name: "Qualified", scope: "lead", tag_type: "stage" },
  { name: "Quoted", scope: "lead", tag_type: "stage" },
  { name: "Scheduled", scope: "lead", tag_type: "stage" },
  { name: "Won", scope: "lead", tag_type: "stage" },
  { name: "Lost", scope: "lead", tag_type: "stage" },
  { name: "Web", scope: "lead", tag_type: "source" },
  { name: "Referral", scope: "lead", tag_type: "source" },
  { name: "Phone", scope: "lead", tag_type: "source" },
  { name: "VIP", scope: "client", tag_type: "segment" },
  { name: "Repeat", scope: "client", tag_type: "segment" },
  { name: "Agent", scope: "client", tag_type: "segment" },
  { name: "Scheduled", scope: "inspection", tag_type: "status" },
  { name: "In Progress", scope: "inspection", tag_type: "status" },
  { name: "Pending Report", scope: "inspection", tag_type: "status" },
  { name: "Completed", scope: "inspection", tag_type: "status" },
  { name: "Draft", scope: "invoice", tag_type: "status" },
  { name: "Sent", scope: "invoice", tag_type: "status" },
  { name: "Paid", scope: "invoice", tag_type: "status" },
  { name: "Overdue", scope: "invoice", tag_type: "status" },
  { name: "Scheduled", scope: "job", tag_type: "status" },
  { name: "In Progress", scope: "job", tag_type: "status" },
  { name: "Completed", scope: "job", tag_type: "status" },
  { name: "High Priority", scope: "job", tag_type: "priority" },
];

export async function POST() {
  const tenantId = getTenantId();

  const { data: existingTags, error: existingError } = await supabaseAdmin
    .from("tags")
    .select("name, scope")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingKey = new Set(
    (existingTags ?? []).map((tag) => `${tag.scope}:${tag.name}`.toLowerCase())
  );

  const toInsert = seedTags.filter(
    (tag) => !existingKey.has(`${tag.scope}:${tag.name}`.toLowerCase())
  );

  if (toInsert.length === 0) {
    return NextResponse.json({ message: "Tags already seeded." });
  }

  const { error: insertError } = await supabaseAdmin.from("tags").insert(
    toInsert.map((tag) => ({
      tenant_id: tenantId,
      name: tag.name,
      scope: tag.scope,
      tag_type: tag.tag_type,
      description: tag.description ?? null,
      is_active: true,
    }))
  );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Seeded ${toInsert.length} tags.` });
}
