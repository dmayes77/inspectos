"use client";

import { useRef, useState } from "react";
import { requestAgentScrub } from "@/lib/api/agent-scrub";
import type { AgentScrubResult } from "@/types/agent-scrub";

export function useAgentScrub() {
  const controllerRef = useRef<AbortController | null>(null);
  const [result, setResult] = useState<AgentScrubResult | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrub = async (url: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsScrubbing(true);
    setError(null);

    try {
      const payload = await requestAgentScrub(url, controller.signal);
      console.log("Agent scrub result", payload.data);
      setResult(payload.data);
      return payload.data;
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
