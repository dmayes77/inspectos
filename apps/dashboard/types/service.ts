/**
 * Centralized Service type definitions
 * Single source of truth for service-related types
 */

export type ServiceType = {
  serviceId: string;
  name: string;
  price?: number;
  durationMinutes?: number;
  templateId?: string | null;
  isPackage?: boolean;
  includedServiceIds?: string[];
  description?: string;
  category?: "core" | "addon";
  includes?: string[];
  status?: "active" | "inactive";
};
