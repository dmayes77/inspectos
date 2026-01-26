import type { AgentScrubResponse } from "@/types/agent-scrub";

type AgentScrubOptions = {
  excludePhotos?: string[];
};

export async function requestAgentScrub(url: string, signal?: AbortSignal, options?: AgentScrubOptions): Promise<AgentScrubResponse> {
  const response = await fetch("/api/admin/agents/scrub", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, excludePhotos: options?.excludePhotos ?? [] }),
    signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error?.message ?? "Unable to scrub that profile.";
    throw new Error(message);
  }

  return (await response.json()) as AgentScrubResponse;
}

export type { AgentScrubOptions };
