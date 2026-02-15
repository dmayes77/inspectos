/**
 * Properties hooks
 * React Query hooks for property management
 */

import { toast } from 'sonner';
import { useGet, usePost, usePatch, useDelete } from '@/hooks/crud';
import { useApiClient } from '@/lib/api/tenant-context';

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
  bedrooms: number | null;
  bathrooms: number | null;
  stories: string | null;
  foundation: string | null;
  garage: string | null;
  pool: boolean | null;
  basement: 'none' | 'unfinished' | 'finished' | 'partial' | null;
  lot_size_acres: number | null;
  heating_type: string | null;
  cooling_type: string | null;
  roof_type: string | null;
  building_class: 'A' | 'B' | 'C' | null;
  loading_docks: number | null;
  zoning: string | null;
  occupancy_type: string | null;
  ceiling_height: number | null;
  number_of_units: number | null;
  unit_mix: string | null;
  laundry_type: 'in-unit' | 'shared' | 'none' | null;
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
  bedrooms?: number | null;
  bathrooms?: number | null;
  stories?: string | null;
  foundation?: string | null;
  garage?: string | null;
  pool?: boolean | null;
  basement?: Property['basement'];
  lot_size_acres?: number | null;
  heating_type?: string | null;
  cooling_type?: string | null;
  roof_type?: string | null;
  building_class?: Property['building_class'];
  loading_docks?: number | null;
  zoning?: string | null;
  occupancy_type?: string | null;
  ceiling_height?: number | null;
  number_of_units?: number | null;
  unit_mix?: string | null;
  laundry_type?: Property['laundry_type'];
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
  bedrooms?: number | null;
  bathrooms?: number | null;
  stories?: string | null;
  foundation?: string | null;
  garage?: string | null;
  pool?: boolean | null;
  basement?: Property['basement'];
  lot_size_acres?: number | null;
  heating_type?: string | null;
  cooling_type?: string | null;
  roof_type?: string | null;
  building_class?: Property['building_class'];
  loading_docks?: number | null;
  zoning?: string | null;
  occupancy_type?: string | null;
  ceiling_height?: number | null;
  number_of_units?: number | null;
  unit_mix?: string | null;
  laundry_type?: Property['laundry_type'];
  parking_spaces?: number | null;
  elevator?: boolean | null;
}

export interface PropertyFilters {
  client_id?: string;
}

export function formatPropertyAddress(property: Property): string {
  const parts = [property.address_line1];
  if (property.address_line2) parts.push(property.address_line2);
  parts.push(`${property.city}, ${property.state} ${property.zip_code}`);
  return parts.join(', ');
}

export function useProperties(filters?: PropertyFilters) {
  const apiClient = useApiClient();
  return useGet<Property[]>(['properties', filters], async () => {
    const params = new URLSearchParams();
    if (filters?.client_id) params.append('client_id', filters.client_id);
    const endpoint = params.toString() ? `/admin/properties?${params}` : '/admin/properties';
    return await apiClient.get<Property[]>(endpoint);
  });
}

export function useProperty(propertyId: string) {
  const apiClient = useApiClient();
  return useGet<Property>(
    ['properties', propertyId],
    () => apiClient.get<Property>(`/admin/properties/${propertyId}`),
    { enabled: !!propertyId, refetchOnMount: 'always', refetchOnWindowFocus: true },
  );
}

export function useCreateProperty() {
  const apiClient = useApiClient();
  return usePost<Property, CreatePropertyInput>(
    'properties',
    (input) => apiClient.post<Property>('/admin/properties', input),
    {
      onSuccess: () => toast.success('Property created successfully'),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to create property'),
    },
  );
}

export function useUpdateProperty(propertyId: string) {
  const apiClient = useApiClient();
  return usePatch<Property, UpdatePropertyInput>(
    'properties',
    (input) => apiClient.patch<Property>(`/admin/properties/${propertyId}`, input),
    {
      onSuccess: () => toast.success('Property updated successfully'),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to update property'),
    },
  );
}

export function useDeleteProperty() {
  const apiClient = useApiClient();
  return useDelete<{ deleted: boolean }>(
    'properties',
    (propertyId) => apiClient.delete<{ deleted: boolean }>(`/admin/properties/${propertyId}`),
    {
      onSuccess: () => toast.success('Property deleted successfully'),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to delete property'),
    },
  );
}
