"use client";

import { useRef, useState } from "react";
import { createAgentScrubApi, type AgentScrubOptions } from "@inspectos/shared/api";
import { agentScrubQueryKeys } from "@inspectos/shared/query";
import type { AgentScrubResult } from "@/types/agent-scrub";
import { createApiClient } from "@/lib/api/client";

export function useAgentScrub() {
  const apiClient = createApiClient();
  const agentScrubApi = createAgentScrubApi(apiClient);
  const controllerRef = useRef<AbortController | null>(null);
  const [result, setResult] = useState<AgentScrubResult | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrub = async (url: string, options?: AgentScrubOptions) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsScrubbing(true);
    setError(null);

    try {
      const payload = await agentScrubApi.scrub<{ data: AgentScrubResult }>(url, controller.signal, options);
      void agentScrubQueryKeys.all;
      const scrubData = payload?.data;
      console.log("Agent scrub result", scrubData);
      if (!scrubData) {
        throw new Error("No profile details were returned from the scrub request.");
      }
      setResult(scrubData);
      return scrubData;
    } catch (scrubError) {
      const message = scrubError instanceof Error ? scrubError.message : "Unable to scrub that profile.";
      setError(message);
      throw scrubError;
    } finally {
      setIsScrubbing(false);
    }
  };

  const reset = () => {
    controllerRef.current?.abort();
    setResult(null);
    setError(null);
  };

  return { scrub, reset, result, isScrubbing, error };
}
