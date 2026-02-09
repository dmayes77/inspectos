import { useGet } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type PayoutInspector = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type Payout = {
  id: string;
  inspector: PayoutInspector | null;
  period_start: string;
  period_end: string;
  gross_amount: number;
  deductions: number;
  net_amount: number;
  status: string;
  items_count: number;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
};

export type PayRule = {
  id: string;
  name: string;
  description: string | null;
  rule_type: "percentage" | "flat_rate" | "hourly";
  percentage: number | null;
  flat_amount: number | null;
  hourly_rate: number | null;
  applies_to: "all" | "specific";
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function usePayouts() {
  const apiClient = useApiClient();
  return useGet<Payout[]>("payouts", async () => {
    return await apiClient.get<Payout[]>('/admin/payouts');
  });
}

export function usePayRules() {
  const apiClient = useApiClient();
  return useGet<PayRule[]>("pay-rules", async () => {
    return await apiClient.get<PayRule[]>('/admin/pay-rules');
  });
}
