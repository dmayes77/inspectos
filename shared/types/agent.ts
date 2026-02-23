export type AgentStatus = "active" | "inactive";
export type ReportFormat = "pdf" | "html" | "both";

export interface Agent {
  id: string;
  tenant_id: string;
  agency_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  license_number: string | null;
  magic_link_token: string | null;
  magic_link_expires_at: string | null;
  last_portal_access_at: string | null;
  portal_access_enabled: boolean;
  status: AgentStatus;
  notes: string | null;
  preferred_report_format: ReportFormat;
  notify_on_schedule: boolean;
  notify_on_complete: boolean;
  notify_on_report: boolean;
  total_referrals: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
  agency?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  } | null;
  orders?: Array<{
    id: string;
    order_number: string;
    status: string;
    scheduled_date: string | null;
    total: number;
    property?: {
      address_line1: string;
      city: string;
      state: string;
    };
  }>;
  _count?: {
    orders: number;
  };
  avatar_url?: string | null;
  brand_logo_url?: string | null;
  agency_address?: string | null;
  agency_website?: string | null;
}

export interface CreateAgentInput {
  tenant_slug?: string;
  agency_id?: string | null;
  agency_name?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  role?: string | null;
  status?: AgentStatus;
  notes?: string | null;
  preferred_report_format?: ReportFormat;
  notify_on_schedule?: boolean;
  notify_on_complete?: boolean;
  notify_on_report?: boolean;
  portal_access_enabled?: boolean;
  avatar_url?: string | null;
  brand_logo_url?: string | null;
  agency_address?: string | null;
  agency_website?: string | null;
}

export interface UpdateAgentInput {
  id: string;
  agency_id?: string | null;
  agency_name?: string | null;
  name?: string;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  role?: string | null;
  status?: AgentStatus;
  notes?: string | null;
  preferred_report_format?: ReportFormat;
  notify_on_schedule?: boolean;
  notify_on_complete?: boolean;
  notify_on_report?: boolean;
  portal_access_enabled?: boolean;
  avatar_url?: string | null;
  brand_logo_url?: string | null;
  agency_address?: string | null;
  agency_website?: string | null;
}

export interface AgentFilters {
  status?: AgentStatus;
  agency_id?: string;
  search?: string;
}
