/**
 * Properties data layer
 * Handles property CRUD operations
 */

export interface Property {
  id: string;
  tenant_id: string;
  client_id: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type: 'residential' | 'commercial' | 'multi-family' | 'other';
  year_built: number | null;
  square_feet: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface CreatePropertyInput {
  tenant_slug: string;
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
}

export interface PropertyFilters {
  client_id?: string;
}

export async function fetchProperties(tenantSlug: string, filters?: PropertyFilters): Promise<Property[]> {
  const params = new URLSearchParams({ tenant: tenantSlug });

  if (filters?.client_id) params.append('client_id', filters.client_id);

  const response = await fetch(`/api/admin/properties?${params}`, {
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

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
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

/**
 * Format a property address for display
 */
export function formatPropertyAddress(property: Property): string {
  const parts = [property.address_line1];
  if (property.address_line2) parts.push(property.address_line2);
  parts.push(`${property.city}, ${property.state} ${property.zip_code}`);
  return parts.join(', ');
}
