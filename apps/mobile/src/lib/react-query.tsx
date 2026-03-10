import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query';
import { defaultReactQueryClientOptions } from '@inspectos/shared/query';
import { useEffect, useState, type ReactNode } from 'react';
import { syncPendingInspectionMutations } from '../services/inspectionOfflineQueue';

const QUERY_CACHE_STORAGE_KEY = 'inspectos:mobile:query-cache';

function restoreQueryClient(queryClient: QueryClient) {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
    if (!raw) return;
    hydrate(queryClient, JSON.parse(raw));
  } catch {
    // Ignore invalid persisted cache data.
  }
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient(defaultReactQueryClientOptions);
    restoreQueryClient(client);
    return client;
  });

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      try {
        const snapshot = dehydrate(queryClient);
        window.localStorage.setItem(QUERY_CACHE_STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore cache persistence failures.
      }
    });

    const syncOfflineMutations = async () => {
      if (!navigator.onLine) return;
      const queryCacheEntries = queryClient.getQueryCache().findAll({ queryKey: ['mobile', 'orders'] });
      const tenantSlugs = new Set<string>();
      queryCacheEntries.forEach((entry) => {
        const slug = entry.queryKey[2];
        if (typeof slug === 'string') {
          tenantSlugs.add(slug);
        }
      });

      for (const tenantSlug of tenantSlugs) {
        const result = await syncPendingInspectionMutations(tenantSlug);
        if (result.synced > 0) {
          await queryClient.invalidateQueries({ queryKey: ['mobile', 'order', tenantSlug] });
          await queryClient.invalidateQueries({ queryKey: ['mobile', 'orders', tenantSlug] });
        }
      }
    };

    void syncOfflineMutations();
    window.addEventListener('online', syncOfflineMutations);

    return () => {
      unsubscribe();
      window.removeEventListener('online', syncOfflineMutations);
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
