import { useGet } from "@/hooks/crud";
import { fetchPayouts, fetchPayRules, type Payout, type PayRule } from "@/lib/data/payouts";

export type { Payout, PayRule };

export function usePayouts() {
  return useGet<Payout[]>("payouts", async () => fetchPayouts());
}

export function usePayRules() {
  return useGet<PayRule[]>("pay-rules", async () => fetchPayRules());
}
