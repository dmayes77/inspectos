import type { AgentScrubResponse } from "@/types/agent-scrub";

type AgentScrubOptions = {
  excludePhotos?: string[];
};

export async function requestAgentScrub(url: string, signal?: AbortSignal, options?: AgentScrubOptions): Promise<AgentScrubResponse> {
  const endpoint = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/admin/agents/scrub`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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
