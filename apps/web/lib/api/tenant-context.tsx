"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createApiClient, type ApiClient } from "./client";

interface TenantContextValue {
  businessSlug: string;
  apiClient: ApiClient;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  businessSlug: string;
  children: ReactNode;
}

/**
 * Provider component that makes tenant context available to all child components
 */
export function TenantProvider({ businessSlug, children }: TenantProviderProps) {
  const resolvedBusinessSlug = businessSlug.trim();
  const apiClient = useMemo(() => createApiClient(resolvedBusinessSlug), [resolvedBusinessSlug]);

  return (
    <TenantContext.Provider value={{ businessSlug: resolvedBusinessSlug, apiClient }}>
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

  return { tenantSlug: context.businessSlug };
}

export function useBusiness(): { businessSlug: string } {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useBusiness must be used within TenantProvider");
  }

  return { businessSlug: context.businessSlug };
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
