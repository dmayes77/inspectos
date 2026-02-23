/**
 * Properties hooks
 * React Query hooks for property management
 */

import { toast } from 'sonner';
import { useGet, usePost, usePatch, useDelete } from '@/hooks/crud';
import { useApiClient } from '@/lib/api/tenant-context';
import { createPropertiesApi } from "@inspectos/shared/api";
import { propertiesQueryKeys } from "@inspectos/shared/query";
import type { CreatePropertyInput, Property, PropertyFilters, PropertyOwner, UpdatePropertyInput } from "@inspectos/shared/types/property";

export type { CreatePropertyInput, Property, PropertyFilters, PropertyOwner, UpdatePropertyInput };

export function formatPropertyAddress(property: Property): string {
  const parts = [property.address_line1];
  if (property.address_line2) parts.push(property.address_line2);
  parts.push(`${property.city}, ${property.state} ${property.zip_code}`);
  return parts.join(', ');
}

export function useProperties(filters?: PropertyFilters) {
  const apiClient = useApiClient();
  const propertiesApi = createPropertiesApi(apiClient);
  return useGet<Property[]>(propertiesQueryKeys.list(filters), async () => {
    return await propertiesApi.list(filters);
  });
}

export function useProperty(propertyId: string) {
  const apiClient = useApiClient();
  const propertiesApi = createPropertiesApi(apiClient);
  return useGet<Property>(
    propertiesQueryKeys.detail(propertyId),
    () => propertiesApi.getById(propertyId),
    { enabled: !!propertyId, refetchOnMount: 'always', refetchOnWindowFocus: true },
  );
}

export function useCreateProperty() {
  const apiClient = useApiClient();
  const propertiesApi = createPropertiesApi(apiClient);
  return usePost<Property, CreatePropertyInput>(
    propertiesQueryKeys.all,
    (input) => propertiesApi.create(input),
    {
      onSuccess: () => toast.success('Property created successfully'),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to create property'),
    },
  );
}

export function useUpdateProperty(propertyId: string) {
  const apiClient = useApiClient();
  const propertiesApi = createPropertiesApi(apiClient);
  return usePatch<Property, UpdatePropertyInput>(
    propertiesQueryKeys.all,
    (input) => propertiesApi.update(propertyId, input),
    {
      onSuccess: () => toast.success('Property updated successfully'),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to update property'),
    },
  );
}

export function useDeleteProperty() {
  const apiClient = useApiClient();
  const propertiesApi = createPropertiesApi(apiClient);
  return useDelete<{ deleted: boolean }>(
    propertiesQueryKeys.all,
    (propertyId) => propertiesApi.remove(propertyId),
    {
      onSuccess: () => toast.success('Property deleted successfully'),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Failed to delete property'),
    },
  );
}
