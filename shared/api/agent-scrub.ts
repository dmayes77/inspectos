import type { ApiClient } from "./client";

export type AgentScrubOptions = {
  excludePhotos?: string[];
};

export function createAgentScrubApi(apiClient: ApiClient) {
  return {
    scrub: async <TResponse>(url: string, signal?: AbortSignal, options?: AgentScrubOptions): Promise<TResponse> => {
      return apiClient.post<TResponse>(
        "/admin/agents/scrub",
        {
          url,
          excludePhotos: options?.excludePhotos ?? [],
          debug: process.env.NODE_ENV !== "production",
        },
        { signal }
      );
    },
  };
}
