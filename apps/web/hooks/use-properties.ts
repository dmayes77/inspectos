/**
 * Properties hooks
 * React Query hooks for property management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchProperties,
  fetchProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  formatPropertyAddress,
  type Property,
  type CreatePropertyInput,
  type UpdatePropertyInput,
  type PropertyFilters,
} from '@/lib/data/properties';

const PROPERTIES_KEY = 'properties';

export function useProperties(tenantSlug: string, filters?: PropertyFilters) {
  return useQuery({
    queryKey: [PROPERTIES_KEY, tenantSlug, filters],
    queryFn: () => fetchProperties(tenantSlug, filters),
    enabled: !!tenantSlug,
  });
}

export function useProperty(propertyId: string) {
  return useQuery({
    queryKey: [PROPERTIES_KEY, propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePropertyInput) => createProperty(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
      toast.success('Property created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create property');
    },
  });
}

export function useUpdateProperty(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePropertyInput) => updateProperty(propertyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_KEY, propertyId] });
      toast.success('Property updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update property');
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_KEY] });
      toast.success('Property deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete property');
    },
  });
}

export { formatPropertyAddress };
export type { Property, CreatePropertyInput, UpdatePropertyInput, PropertyFilters };
