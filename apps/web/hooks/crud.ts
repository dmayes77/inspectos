// src/hooks/crud.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useGet<T>(key: string, fetcher: () => Promise<T>, options?: Record<string, unknown>) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: fetcher,
    ...options,
  });
}

export function usePost<T, U>(key: string, poster: (data: U) => Promise<T>, options?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  return useMutation<T, unknown, U>({
    mutationFn: poster,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    ...options,
  });
}

export function usePut<T, U>(key: string, putter: (data: U) => Promise<T>, options?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  return useMutation<T, unknown, U>({
    mutationFn: putter,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    ...options,
  });
}

export function usePatch<T, U>(key: string, patcher: (data: U) => Promise<T>, options?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  return useMutation<T, unknown, U>({
    mutationFn: patcher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    ...options,
  });
}

export function useDelete<T>(key: string, deleter: (id: string) => Promise<T>, options?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  return useMutation<T, unknown, string>({
    mutationFn: deleter,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    ...options,
  });
}
