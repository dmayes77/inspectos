/**
 * Centralized Inspection type definitions
 * Aligned with database schema (supabase/migrations/001_initial_schema.sql)
 */

/**
 * Database-aligned Inspection type
 */
export interface Inspection {
  id: string;
  tenant_id: string;
  order_id: string | null;
  template_id: string | null;
  template_version: number;
  inspector_id: string | null;
  status: InspectionStatusValue;
  started_at: string | null;
  completed_at: string | null;
  weather_conditions: string | null;
  temperature: string | null;
  present_parties: string[] | null;
  notes: string | null;
  selected_type_ids?: string[] | null;
  created_at: string;
  updated_at: string;
  order_schedule_id?: string | null;
  schedule?: InspectionSchedule | null;
  summary?: InspectionSummary | null;
  // Joined relations
  order?: {
    id: string;
    scheduled_date: string | null;
    status: string;
    property?: Property | null;
    client?: Client | null;
    inspector?: {
      id: string;
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    } | null;
  } | null;
  template?: {
    id: string;
    name: string;
    description: string | null;
  };
  inspector?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  vendors?: any[];
  vendorIds?: string[];
}

export type InspectionScheduleType = "primary" | "addon" | "package" | "follow_up" | "reinspection" | "other";
export type InspectionScheduleStatus = "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";

export interface InspectionSchedule {
  id: string;
  tenant_id: string;
  order_id: string;
  schedule_type: InspectionScheduleType;
  label: string | null;
  service_id: string | null;
  package_id: string | null;
  inspector_id: string | null;
  slot_date: string | null;
  slot_start: string | null;
  slot_end: string | null;
  duration_minutes: number | null;
  status: InspectionScheduleStatus;
  notes: string | null;
}

export interface InspectionSummary {
  property?: Property | null;
  client?: Client | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number | null;
  service_ids?: string[];
}

/**
 * Property type from database
 */
export interface Property {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type: "single-family" | "condo-townhome" | "multi-family" | "manufactured" | "commercial";
  year_built: number | null;
  square_feet: number | null;
}

/**
 * Client type from database
 */
export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
}

/**
 * Inspection status values (aligned with database CHECK constraint)
 */
export const InspectionStatus = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SUBMITTED: "submitted",
} as const;

export type InspectionStatusValue = (typeof InspectionStatus)[keyof typeof InspectionStatus];

/**
 * Format property address for display
 */
export function formatAddress(property: Property): string {
  const parts = [property.address_line1];
  if (property.address_line2) parts.push(property.address_line2);
  parts.push(`${property.city}, ${property.state} ${property.zip_code}`);
  return parts.join(", ");
}
