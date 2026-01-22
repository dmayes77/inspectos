import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET() {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from("pay_rules")
    .select(
      `
        id,
        name,
        description,
        rule_type,
        percentage,
        flat_amount,
        hourly_rate,
        applies_to,
        is_default,
        is_active,
        created_at,
        updated_at
      `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  const mapped = (data ?? []).map((rule) => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    rule_type: rule.rule_type,
    percentage: rule.percentage,
    flat_amount: rule.flat_amount,
    hourly_rate: rule.hourly_rate,
    applies_to: rule.applies_to,
    is_default: rule.is_default,
    is_active: rule.is_active,
    created_at: rule.created_at,
    updated_at: rule.updated_at,
  }));

  return NextResponse.json(mapped);
}
