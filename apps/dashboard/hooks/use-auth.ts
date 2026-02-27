"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAuthApi } from "@inspectos/shared/api";
import { authQueryKeys } from "@inspectos/shared/query";
import { ApiError, createApiClient } from "@/lib/api/client";

const authSessionQueryKey = authQueryKeys.session();
const authApi = createAuthApi(createApiClient());

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    queryFn: () =>
      authApi
        .getSession<{ user: { id: string; email: string | null } | null }>()
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401) {
            return { user: null };
          }
          const message = error instanceof Error ? error.message : "";
          if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("session expired")) {
            return { user: null };
          }
          throw error;
        }),
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      authApi.login<{ user: { id: string | null; email: string | null } }>(payload.email, payload.password),
    onSuccess: (data) => {
      queryClient.setQueryData(authSessionQueryKey, data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout<{ loggedOut: boolean }>(),
    onSuccess: () => {
      queryClient.setQueryData(authSessionQueryKey, null);
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      full_name: string;
      email_redirect_to?: string;
    }) =>
      authApi.signup<{
        requires_email_confirmation: boolean;
        user: { id: string | null; email: string | null };
      }>(payload),
    onSuccess: (data) => {
      if (!data.requires_email_confirmation) {
        void queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
      }
    },
  });
}

export function useResendConfirmation() {
  return useMutation({
    mutationFn: (payload: { email: string; emailRedirectTo?: string }) =>
      authApi.resendConfirmation<{ sent: boolean }>(payload.email, payload.emailRedirectTo),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (payload: { email: string; redirectTo: string }) =>
      authApi.requestPasswordReset<{ sent: boolean }>(payload.email, payload.redirectTo),
  });
}

export function useConfirmOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tokenHash: string; type: string }) =>
      authApi.confirmOtp<{ redirect_to: string; type: string }>(payload.tokenHash, payload.type),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
}

export function useExchangeCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { code: string }) =>
      authApi.exchangeCode<{ user: { id: string | null; email: string | null } }>(payload.code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
}

export function useSetSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { accessToken: string; refreshToken: string }) =>
      authApi.setSession<{ user: { id: string | null; email: string | null } }>(
        payload.accessToken,
        payload.refreshToken
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { password: string }) => authApi.resetPassword<{ updated: boolean }>(payload.password),
  });
}
