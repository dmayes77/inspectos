/**
 * Properties hooks
 * React Query hooks for property management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchProperties,
  createProperty,
  formatPropertyAddress,
  type Property,
  type CreatePropertyInput,
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

export { formatPropertyAddress };
export type { Property, CreatePropertyInput, PropertyFilters };
