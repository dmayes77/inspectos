import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { clients as mockClients } from "@/lib/mock/clients";

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

export async function POST() {
  const tenantId = getTenantId();

  const { data: existingClients } = await supabaseAdmin
    .from("clients")
    .select("id, email, name")
    .eq("tenant_id", tenantId);

  const clientMap = new Map<string, string>();
  (existingClients ?? []).forEach((client) => {
    if (client.email) {
      clientMap.set(client.email.toLowerCase(), client.id);
    }
    clientMap.set(client.name.toLowerCase(), client.id);
  });

  const inserts = mockClients
    .filter((client) => {
      const key = client.email?.toLowerCase() || client.name.toLowerCase();
      return !clientMap.has(key);
    })
    .map((client) => ({
      tenant_id: tenantId,
      name: client.name,
      email: client.email ?? null,
      phone: client.phone ?? null,
      type: client.type ?? null,
      inspections_count: client.inspections ?? 0,
      last_inspection_date: parseDate(client.lastInspection) ?? null,
      total_spent: client.totalSpent ?? 0,
      notes: client.type ? `Type: ${client.type}` : null,
    }));

  if (inserts.length === 0) {
    return NextResponse.json({ message: "No new clients to seed." });
  }

  const { error } = await supabaseAdmin.from("clients").insert(inserts);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Seeded ${inserts.length} clients.` });
}
