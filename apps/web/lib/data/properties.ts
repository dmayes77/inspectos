/**
 * Properties data layer
 * Handles property CRUD operations
 */

import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true';
  if (isDevelopment && process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID) {
    return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID;
  }
  return "default";
}

export interface Property {
  id: string;
  tenant_id: string;
  client_id: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type: 'single-family' | 'condo-townhome' | 'multi-family' | 'manufactured' | 'commercial';
  year_built: number | null;
  square_feet: number | null;
  notes: string | null;

  // Common property details
  bedrooms: number | null;
  bathrooms: number | null;
  stories: string | null;
  foundation: string | null;
  garage: string | null;
  pool: boolean | null;

  // Residential specific
  basement: 'none' | 'unfinished' | 'finished' | 'partial' | null;
  lot_size_acres: number | null;
  heating_type: string | null;
  cooling_type: string | null;
  roof_type: string | null;

  // Commercial specific
  building_class: 'A' | 'B' | 'C' | null;
  loading_docks: number | null;
  zoning: string | null;
  occupancy_type: string | null;
  ceiling_height: number | null;

  // Multi-family specific
  number_of_units: number | null;
  unit_mix: string | null;
  laundry_type: 'in-unit' | 'shared' | 'none' | null;

  // Shared (commercial/multi-family)
  parking_spaces: number | null;
  elevator: boolean | null;

  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  owners?: PropertyOwner[];
}

export type PropertyOwner = {
  propertyOwnerId: string;
  propertyId: string;
  clientId: string;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company?: string | null;
  } | null;
};

export interface CreatePropertyInput {
  client_id?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type?: Property['property_type'];
  year_built?: number | null;
  square_feet?: number | null;
  notes?: string | null;

  // Common property details
  bedrooms?: number | null;
  bathrooms?: number | null;
  stories?: string | null;
  foundation?: string | null;
  garage?: string | null;
  pool?: boolean | null;

  // Residential specific
  basement?: Property['basement'];
  lot_size_acres?: number | null;
  heating_type?: string | null;
  cooling_type?: string | null;
  roof_type?: string | null;

  // Commercial specific
  building_class?: Property['building_class'];
  loading_docks?: number | null;
  zoning?: string | null;
  occupancy_type?: string | null;
  ceiling_height?: number | null;

  // Multi-family specific
  number_of_units?: number | null;
  unit_mix?: string | null;
  laundry_type?: Property['laundry_type'];

  // Shared (commercial/multi-family)
  parking_spaces?: number | null;
  elevator?: boolean | null;
}

export interface UpdatePropertyInput {
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type?: Property['property_type'];
  year_built?: number | null;
  square_feet?: number | null;
  notes?: string | null;
  client_id?: string | null;

  // Common property details
  bedrooms?: number | null;
  bathrooms?: number | null;
  stories?: string | null;
  foundation?: string | null;
  garage?: string | null;
  pool?: boolean | null;

  // Residential specific
  basement?: Property['basement'];
  lot_size_acres?: number | null;
  heating_type?: string | null;
  cooling_type?: string | null;
  roof_type?: string | null;

  // Commercial specific
  building_class?: Property['building_class'];
  loading_docks?: number | null;
  zoning?: string | null;
  occupancy_type?: string | null;
  ceiling_height?: number | null;

  // Multi-family specific
  number_of_units?: number | null;
  unit_mix?: string | null;
  laundry_type?: Property['laundry_type'];

  // Shared (commercial/multi-family)
  parking_spaces?: number | null;
  elevator?: boolean | null;
}

export interface PropertyFilters {
  client_id?: string;
}

export async function fetchProperties(filters?: PropertyFilters): Promise<Property[]> {
  if (shouldUseExternalApi("properties")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const params = new URLSearchParams();
    if (filters?.client_id) params.append('client_id', filters.client_id);
    const endpoint = params.toString() ? `/admin/properties?${params}` : '/admin/properties';
    return await apiClient.get<Property[]>(endpoint);
  } else {
    // Use local Next.js API route
    const params = new URLSearchParams();
    if (filters?.client_id) params.append('client_id', filters.client_id);
    const url = params.toString() ? `/api/admin/properties?${params}` : '/api/admin/properties';
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch properties');
    }

    const result = await response.json();
    return result.data;
  }
}

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  if (shouldUseExternalApi("properties")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<Property>('/admin/properties', input);
  } else {
    // Use local Next.js API route
    const response = await fetch('/api/admin/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create property');
    }

    const result = await response.json();
    return result.data;
  }
}

export async function fetchProperty(propertyId: string): Promise<Property> {
  if (shouldUseExternalApi("properties")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Property>(`/admin/properties/${propertyId}`);
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/properties/${propertyId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch property');
    }

    const result = await response.json();
    return result.data;
  }
}

export async function updateProperty(propertyId: string, input: UpdatePropertyInput): Promise<Property> {
  if (shouldUseExternalApi("properties")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.patch<Property>(`/admin/properties/${propertyId}`, input);
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/properties/${propertyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update property');
    }

    const result = await response.json();
    return result.data;
  }
}

export async function deleteProperty(propertyId: string): Promise<void> {
  if (shouldUseExternalApi("properties")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    await apiClient.delete<{ deleted: boolean }>(`/admin/properties/${propertyId}`);
  } else {
    // Use local Next.js API route
    const response = await fetch(`/api/admin/properties/${propertyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete property');
    }
  }
}

/**
 * Format a property address for display
 */
export function formatPropertyAddress(property: Property): string {
  const parts = [property.address_line1];
  if (property.address_line2) parts.push(property.address_line2);
  parts.push(`${property.city}, ${property.state} ${property.zip_code}`);
  return parts.join(', ');
}
