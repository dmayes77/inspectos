"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getJSON,
  setJSON,
  removeItem,
  getOfflineQueue,
  addToOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  getDrafts,
  getDraft,
  saveDraft,
  deleteDraft,
  type OfflineAction,
  type InspectionDraft,
} from "@/services/storage";

// =============================================================================
// GENERIC STORAGE HOOK
// =============================================================================

export function useStoredValue<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const stored = await getJSON<T>(key);
      if (stored !== null) {
        setValue(stored);
      }
      setIsLoading(false);
    }
    load();
  }, [key]);

  const set = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await setJSON(key, newValue);
    },
    [key]
  );

  const remove = useCallback(async () => {
    setValue(defaultValue);
    await removeItem(key);
  }, [key, defaultValue]);

  return { value, set, remove, isLoading };
}

// =============================================================================
// OFFLINE QUEUE HOOK
// =============================================================================

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const q = await getOfflineQueue();
    setQueue(q);
    return q;
  }, []);

  useEffect(() => {
    refresh().then(() => setIsLoading(false));
  }, [refresh]);

  const add = useCallback(
    async (action: Omit<OfflineAction, "id" | "timestamp">) => {
      await addToOfflineQueue(action);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (actionId: string) => {
      await removeFromOfflineQueue(actionId);
      await refresh();
    },
    [refresh]
  );

  const clear = useCallback(async () => {
    await clearOfflineQueue();
    setQueue([]);
  }, []);

  return {
    queue,
    isLoading,
    add,
    remove,
    clear,
    refresh,
    hasItems: queue.length > 0,
    count: queue.length,
  };
}

// =============================================================================
// INSPECTION DRAFTS HOOK
// =============================================================================

export function useInspectionDrafts() {
  const [drafts, setDrafts] = useState<InspectionDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const d = await getDrafts();
    setDrafts(d);
    return d;
  }, []);

  useEffect(() => {
    refresh().then(() => setIsLoading(false));
  }, [refresh]);

  const save = useCallback(
    async (draft: Omit<InspectionDraft, "lastModified">) => {
      await saveDraft(draft);
      await refresh();
    },
    [refresh]
  );

  const get = useCallback(async (id: string) => {
    return getDraft(id);
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await deleteDraft(id);
      await refresh();
    },
    [refresh]
  );

  return {
    drafts,
    isLoading,
    save,
    get,
    remove,
    refresh,
    hasDrafts: drafts.length > 0,
    count: drafts.length,
  };
}

// =============================================================================
// OFFLINE-AWARE MUTATION HOOK
// =============================================================================

interface OfflineMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  entity: string;
  type: "create" | "update" | "delete";
}

export function useOfflineMutation<TData, TVariables extends Record<string, unknown>>(
  options: OfflineMutationOptions<TData, TVariables>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { add: addToQueue } = useOfflineQueue();

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await options.mutationFn(variables);
        setIsLoading(false);
        return result;
      } catch (e) {
        // Check if we're offline
        if (!navigator.onLine) {
          // Queue the action for later
          await addToQueue({
            type: options.type,
            entity: options.entity,
            data: variables,
          });
          setIsLoading(false);
          return null;
        }

        const message = e instanceof Error ? e.message : "Mutation failed";
        setError(message);
        setIsLoading(false);
        throw e;
      }
    },
    [options, addToQueue]
  );

  return { mutate, isLoading, error };
}
