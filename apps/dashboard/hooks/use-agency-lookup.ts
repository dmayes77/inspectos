"use client";

import { useEffect, useState } from "react";
import { createAgencyLookupApi } from "@inspectos/shared/api";
import { agencyLookupQueryKeys } from "@inspectos/shared/query";
import type { AgencyLookupResult } from "@/types/agency-lookup";
import { createApiClient } from "@/lib/api/client";

const MIN_QUERY_LENGTH = 2;

export function useAgencyLookup(query: string) {
  const apiClient = createApiClient();
  const agencyLookupApi = createAgencyLookupApi(apiClient);
  const [results, setResults] = useState<AgencyLookupResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandSearchEnabled, setBrandSearchEnabled] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      setBrandSearchEnabled(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    agencyLookupApi
      .search<{ data?: AgencyLookupResult[]; meta?: { brandSearchEnabled?: boolean } }>(trimmed, controller.signal)
      .then((payload) => {
        void agencyLookupQueryKeys.search(trimmed);
        setResults(payload.data ?? []);
        setBrandSearchEnabled(Boolean(payload.meta?.brandSearchEnabled));
        setError(null);
      })
      .catch((lookupError) => {
        if ((lookupError as Error).name === "AbortError") return;
        console.error("Agency lookup failed", lookupError);
        setError("Unable to search right now. Try again in a moment.");
      })
      .finally(() => setIsSearching(false));

    return () => controller.abort();
  }, [query]);

  return { results, isSearching, error, brandSearchEnabled };
}
