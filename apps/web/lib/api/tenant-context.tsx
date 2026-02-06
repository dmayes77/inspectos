"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createApiClient, type ApiClient } from "./client";

interface TenantContextValue {
  tenantSlug: string;
  apiClient: ApiClient;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  tenantSlug: string;
  children: ReactNode;
}

/**
 * Provider component that makes tenant context available to all child components
 */
export function TenantProvider({ tenantSlug, children }: TenantProviderProps) {
  const apiClient = useMemo(() => createApiClient(tenantSlug), [tenantSlug]);

  return (
    <TenantContext.Provider value={{ tenantSlug, apiClient }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access the current tenant slug
 */
export function useTenant(): { tenantSlug: string } {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }

  return { tenantSlug: context.tenantSlug };
}

/**
 * Hook to access the API client with automatic tenant context
 */
export function useApiClient(): ApiClient {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useApiClient must be used within TenantProvider");
  }

  return context.apiClient;
}
