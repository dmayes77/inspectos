"use client";

import { useEffect, useState } from "react";
import { requestAgencyLookup } from "@/lib/api/agency-lookup";
import type { AgencyLookupResult } from "@/types/agency-lookup";

const MIN_QUERY_LENGTH = 2;

export function useAgencyLookup(query: string) {
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

    requestAgencyLookup(trimmed, controller.signal)
      .then((payload) => {
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
