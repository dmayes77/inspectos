import type { SupabaseClient } from "@supabase/supabase-js";

const BLOCKED_BILLING_STATUSES = new Set([
  "past_due",
  "unpaid",
  "suspended",
  "canceled",
  "cancelled",
  "incomplete_expired",
]);

type BillingSettings = {
  accessBlocked?: boolean;
  paid?: boolean;
  isPaid?: boolean;
  pastDue?: boolean;
  status?: string;
  subscriptionStatus?: string;
  accountStatus?: string;
  paymentStatus?: string;
  graceUntil?: string;
  graceEndsAt?: string;
};

type TenantSettings = {
  billing?: BillingSettings;
};

function parseDate(value: string | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function hasGracePeriod(billing: BillingSettings): boolean {
  const graceTimestamp = parseDate(billing.graceEndsAt ?? billing.graceUntil);
  return graceTimestamp !== null && graceTimestamp > Date.now();
}

function resolveStatus(billing: BillingSettings): string | null {
  const rawStatus =
    billing.subscriptionStatus ??
    billing.status ??
    billing.accountStatus ??
    billing.paymentStatus;
  if (!rawStatus || typeof rawStatus !== "string") return null;
  return rawStatus.trim().toLowerCase();
}

function isBlockedBySettings(settings: TenantSettings | null | undefined): boolean {
  const billing = settings?.billing ?? {};
  if (billing.accessBlocked === true) return true;

  if (hasGracePeriod(billing)) return false;

  if (billing.pastDue === true) return true;
  if (billing.paid === false || billing.isPaid === false) return true;

  const status = resolveStatus(billing);
  return status ? BLOCKED_BILLING_STATUSES.has(status) : false;
}

export async function verifyBusinessBillingAccessByTenantId(
  serviceClient: SupabaseClient,
  tenantId: string
): Promise<{ allowed: boolean; error?: Error }> {
  const { data, error } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    return { allowed: false, error };
  }

  const settings = (data?.settings ?? null) as TenantSettings | null;
  return { allowed: !isBlockedBySettings(settings) };
}
