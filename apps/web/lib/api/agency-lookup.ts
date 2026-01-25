import type { AgencyLookupResponse } from "@/types/agency-lookup";

export async function requestAgencyLookup(query: string, signal?: AbortSignal): Promise<AgencyLookupResponse> {
  const response = await fetch(`/api/admin/agencies/lookup?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Lookup failed");
  }

  return (await response.json()) as AgencyLookupResponse;
}
