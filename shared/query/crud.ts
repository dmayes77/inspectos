import { useQuery, useMutation, useQueryClient, type QueryKey, type UseMutationOptions } from "@tanstack/react-query";

export type QueryKeyInput = QueryKey | string;

function normalizeKey(key: QueryKeyInput): QueryKey {
  return typeof key === "string" ? [key] : key;
}

export function useGet<T>(key: QueryKeyInput, fetcher: () => Promise<T>, options?: Record<string, unknown>) {
  return useQuery<T>({
    queryKey: normalizeKey(key),
    queryFn: fetcher,
    ...options,
  });
}

type MutationOptions<T, U> = UseMutationOptions<T, unknown, U, unknown>;

export function usePost<T, U>(key: QueryKeyInput, poster: (data: U) => Promise<T>, options?: MutationOptions<T, U>) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<T, unknown, U>({
    mutationFn: poster,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: normalizeKey(key) });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...rest,
  });
}

export function usePut<T, U>(key: QueryKeyInput, putter: (data: U) => Promise<T>, options?: MutationOptions<T, U>) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<T, unknown, U>({
    mutationFn: putter,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: normalizeKey(key) });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...rest,
  });
}

export function usePatch<T, U>(key: QueryKeyInput, patcher: (data: U) => Promise<T>, options?: MutationOptions<T, U>) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<T, unknown, U>({
    mutationFn: patcher,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: normalizeKey(key) });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...rest,
  });
}

export function useDelete<T>(key: QueryKeyInput, deleter: (id: string) => Promise<T>, options?: MutationOptions<T, string>) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation<T, unknown, string>({
    mutationFn: deleter,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: normalizeKey(key) });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...rest,
  });
}
