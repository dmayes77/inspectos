"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createApiClient, type ApiClient } from "./client";

interface TenantContextValue {
  apiClient: ApiClient;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes API context available to all child components.
 * Business resolution now happens server-side from authenticated membership.
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const apiClient = useMemo(() => createApiClient(), []);

  return (
    <TenantContext.Provider value={{ apiClient }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Compatibility hook: business slug is no longer required client-side.
 */
export function useTenant(): { tenantSlug: string } {
  return { tenantSlug: "" };
}

export function useBusiness(): { businessSlug: string } {
  return { businessSlug: "" };
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
