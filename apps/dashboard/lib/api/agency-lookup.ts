import type { AgencyLookupResponse } from "@/types/agency-lookup";

export async function requestAgencyLookup(query: string, signal?: AbortSignal): Promise<AgencyLookupResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const response = await fetch(`${baseUrl}/admin/agencies/lookup?q=${encodeURIComponent(query)}`, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error("Lookup failed");
  }

  return (await response.json()) as AgencyLookupResponse;
}
