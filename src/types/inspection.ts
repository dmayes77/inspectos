/**
 * Centralized Inspection type definitions
 * Single source of truth for inspection-related types
 */

/**
 * Inspection type (matches mock data structure)
 * TODO: Align with Prisma schema when migrating from mock data
 */
export type Inspection = {
  inspectionId: string;
  address: string;
  client: string;
  clientId: string;
  inspector: string;
  inspectorId: string;
  date: string;
  time: string;
  types: string[];
  status: string;
  price: number;
  sqft?: number;
  yearBuilt?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  stories?: string;
  foundation?: string;
  garage?: string;
  pool?: boolean;
  notes?: string;
};

/**
 * Inspection status values
 */
export const InspectionStatus = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PENDING_REPORT: "pending_report",
} as const;

export type InspectionStatusValue =
  (typeof InspectionStatus)[keyof typeof InspectionStatus];
