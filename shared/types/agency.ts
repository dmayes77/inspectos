export type AgencyStatus = "active" | "inactive";

export interface Agency {
  id: string;
  tenant_id: string;
  name: string;
  logo_url: string | null;
  license_number: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  status: AgencyStatus;
  notes: string | null;
  total_referrals: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
  agents?: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    total_referrals: number;
  }>;
  _count?: {
    agents: number;
    orders: number;
  };
}

export interface CreateAgencyInput {
  name: string;
  logo_url?: string | null;
  license_number?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  status?: AgencyStatus;
  notes?: string | null;
}

export interface UpdateAgencyInput {
  id: string;
  name?: string;
  logo_url?: string | null;
  license_number?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  status?: AgencyStatus;
  notes?: string | null;
}

export interface AgencyFilters {
  status?: AgencyStatus;
  search?: string;
}
