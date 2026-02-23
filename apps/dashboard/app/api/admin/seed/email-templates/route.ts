import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

type SeedTemplate = {
  name: string;
  subject: string;
  body: string;
  category: string;
  description: string;
  systemKey: string;
};

const seedTemplates: SeedTemplate[] = [
  {
    name: "Lead Welcome",
    subject: "Thanks for reaching out to {{client.name}}",
    category: "lead",
    description: "Initial response for new leads.",
    systemKey: "lead_welcome",
    body: `<p>Hi {{client.firstName}},</p>
<p>Thanks for reaching out to {{business.name}}. We’ll follow up shortly to confirm your inspection needs.</p>
<p>Best,<br/>{{business.name}}</p>`,
  },
  {
    name: "Inspection Scheduled",
    subject: "Your inspection is scheduled for {{inspection.date}}",
    category: "inspection",
    description: "Confirmation after scheduling.",
    systemKey: "inspection_scheduled",
    body: `<p>Hi {{client.firstName}},</p>
<p>Your inspection is scheduled for {{inspection.date}} at {{inspection.time}}.</p>
<p>Property: {{inspection.address}}</p>
<p>Thanks,<br/>{{business.name}}</p>`,
  },
  {
    name: "Inspection Reminder",
    subject: "Reminder: Inspection tomorrow at {{inspection.time}}",
    category: "inspection",
    description: "Reminder before inspection.",
    systemKey: "inspection_reminder",
    body: `<p>Hi {{client.firstName}},</p>
<p>Just a reminder about your inspection on {{inspection.date}} at {{inspection.time}}.</p>
<p>Thanks,<br/>{{business.name}}</p>`,
  },
  {
    name: "Report Ready",
    subject: "Your inspection report is ready",
    category: "inspection",
    description: "Report delivery notice.",
    systemKey: "report_ready",
    body: `<p>Hi {{client.firstName}},</p>
<p>Your inspection report is ready. You can access it from your client portal.</p>
<p>Thanks,<br/>{{business.name}}</p>`,
  },
  {
    name: "Invoice Sent",
    subject: "Invoice {{invoice.number}} from {{business.name}}",
    category: "invoice",
    description: "Invoice sent notification.",
    systemKey: "invoice_sent",
    body: `<p>Hi {{client.firstName}},</p>
<p>Your invoice {{invoice.number}} is ready. Total due: {{invoice.balanceDue}}.</p>
<p>Pay here: {{invoice.paymentUrl}}</p>
<p>Thanks,<br/>{{business.name}}</p>`,
  },
  {
    name: "Invoice Reminder",
    subject: "Reminder: Invoice {{invoice.number}} is due",
    category: "invoice",
    description: "Overdue payment reminder.",
    systemKey: "invoice_reminder",
    body: `<p>Hi {{client.firstName}},</p>
<p>This is a reminder that invoice {{invoice.number}} is due. Balance: {{invoice.balanceDue}}.</p>
<p>Pay here: {{invoice.paymentUrl}}</p>
<p>Thanks,<br/>{{business.name}}</p>`,
  },
];

export async function POST() {
  const tenantId = getTenantId();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("email_templates")
    .select("name, system_key")
    .eq("tenant_id", tenantId);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingKeys = new Set(
    (existing ?? []).map((row) => row.system_key ?? row.name).filter(Boolean)
  );

  const toInsert = seedTemplates.filter((template) => !existingKeys.has(template.systemKey));

  if (toInsert.length === 0) {
    return NextResponse.json({ message: "Email templates already seeded." });
  }

  const { error: insertError } = await supabaseAdmin.from("email_templates").insert(
    toInsert.map((template) => ({
      tenant_id: tenantId,
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
      description: template.description,
      is_system: true,
      system_key: template.systemKey,
    }))
  );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Seeded ${toInsert.length} email templates.` });
}
