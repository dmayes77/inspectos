/**
 * Normalize existing phone values across core tables.
 *
 * Dry run:
 *   npx tsx scripts/normalize-phone-columns.ts
 *
 * Apply changes:
 *   npx tsx scripts/normalize-phone-columns.ts --apply
 *
 * Optional tenant filter:
 *   SUPABASE_BUSINESS_ID=ABC123 npx tsx scripts/normalize-phone-columns.ts --apply
 */

import { createClient } from "@supabase/supabase-js";
import { normalizePhoneForStorage } from "../lib/phone/normalize";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUSINESS_ID = process.env.SUPABASE_BUSINESS_ID?.trim().toUpperCase() || null;
const APPLY = process.argv.includes("--apply");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TableTarget = {
  table: "clients" | "agents" | "agencies" | "leads" | "vendors" | "profiles";
  phoneColumn: "phone";
  tenantColumn?: "tenant_id";
};

const TABLES: TableTarget[] = [
  { table: "clients", phoneColumn: "phone", tenantColumn: "tenant_id" },
  { table: "agents", phoneColumn: "phone", tenantColumn: "tenant_id" },
  { table: "agencies", phoneColumn: "phone", tenantColumn: "tenant_id" },
  { table: "leads", phoneColumn: "phone", tenantColumn: "tenant_id" },
  { table: "vendors", phoneColumn: "phone", tenantColumn: "tenant_id" },
  { table: "profiles", phoneColumn: "phone" },
];

async function resolveTenantIdFromBusinessId() {
  if (!BUSINESS_ID) return null;
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("business_id", BUSINESS_ID)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error(`Could not resolve tenant for SUPABASE_BUSINESS_ID=${BUSINESS_ID}`);
  }

  return data.id as string;
}

async function normalizeTablePhones(target: TableTarget, tenantId: string | null) {
  let query =
    target.tenantColumn
      ? supabase.from(target.table).select("id, phone, tenant_id")
      : supabase.from(target.table).select("id, phone");
  if (tenantId && target.tenantColumn) {
    query = query.eq(target.tenantColumn, tenantId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`${target.table}: failed to load rows (${error.message})`);

  const rows = (data ?? []) as Array<{ id: string; phone: string | null }>;
  let changed = 0;
  let skipped = 0;

  for (const row of rows) {
    const normalized = normalizePhoneForStorage(row.phone);
    const current = typeof row.phone === "string" ? row.phone.trim() : null;
    if (current === normalized) {
      continue;
    }

    changed += 1;
    if (!APPLY) {
      console.log(`[dry-run] ${target.table}.${row.id}: "${row.phone}" -> "${normalized}"`);
      continue;
    }

    const { error: updateError } = await supabase
      .from(target.table)
      .update({ [target.phoneColumn]: normalized })
      .eq("id", row.id);

    if (updateError) {
      skipped += 1;
      console.error(`[error] ${target.table}.${row.id}: ${updateError.message}`);
    }
  }

  return { table: target.table, total: rows.length, changed, skipped };
}

async function normalizeTenantSettingsPhones(tenantId: string | null) {
  let query = supabase.from("tenants").select("id, settings, business_id");
  if (tenantId) query = query.eq("id", tenantId);

  const { data, error } = await query;
  if (error) throw new Error(`tenants.settings: failed to load rows (${error.message})`);

  const tenants = (data ?? []) as Array<{ id: string; settings: Record<string, unknown> | null; business_id?: string | null }>;
  let changed = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    const company =
      settings.company && typeof settings.company === "object"
        ? (settings.company as Record<string, unknown>)
        : {};
    const currentPhoneValue = typeof company.phone === "string" ? company.phone : null;
    const normalized = normalizePhoneForStorage(currentPhoneValue) ?? "";
    const currentNormalizedComparable = currentPhoneValue?.trim() ?? "";

    if (currentNormalizedComparable === normalized) {
      continue;
    }

    changed += 1;
    if (!APPLY) {
      console.log(`[dry-run] tenants.${tenant.id}.settings.company.phone: "${currentPhoneValue}" -> "${normalized}"`);
      continue;
    }

    const nextSettings = {
      ...settings,
      company: {
        ...company,
        phone: normalized,
      },
    };

    const { error: updateError } = await supabase.from("tenants").update({ settings: nextSettings }).eq("id", tenant.id);
    if (updateError) {
      skipped += 1;
      console.error(`[error] tenants.${tenant.id}.settings: ${updateError.message}`);
    }
  }

  return { table: "tenants.settings.company.phone", total: tenants.length, changed, skipped };
}

async function main() {
  const tenantId = await resolveTenantIdFromBusinessId();

  if (APPLY) {
    console.log("Running in APPLY mode");
  } else {
    console.log("Running in DRY-RUN mode (no changes written)");
  }
  if (tenantId) {
    console.log(`Scoped to tenant: ${tenantId} (SUPABASE_BUSINESS_ID=${BUSINESS_ID})`);
  }

  const results = [];
  for (const target of TABLES) {
    // eslint-disable-next-line no-await-in-loop
    const result = await normalizeTablePhones(target, tenantId);
    results.push(result);
  }

  results.push(await normalizeTenantSettingsPhones(tenantId));

  console.log("\nSummary:");
  for (const result of results) {
    console.log(
      `- ${result.table}: scanned=${result.total}, changed=${result.changed}, failed=${result.skipped}`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
