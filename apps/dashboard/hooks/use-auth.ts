"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmOtp,
  exchangeCode,
  getSession,
  login,
  logout,
  requestPasswordReset,
  resendConfirmation,
  resetPassword,
  setSession,
  signup,
} from "@/lib/api/auth";

export const authSessionQueryKey = ["auth", "session"] as const;

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    queryFn: getSession,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) => login(payload.email, payload.password),
    onSuccess: (data) => {
      queryClient.setQueryData(authSessionQueryKey, data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authSessionQueryKey, null);
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signup,
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
      resendConfirmation(payload.email, payload.emailRedirectTo),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (payload: { email: string; redirectTo: string }) =>
      requestPasswordReset(payload.email, payload.redirectTo),
  });
}

export function useConfirmOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tokenHash: string; type: string }) => confirmOtp(payload.tokenHash, payload.type),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
}

export function useExchangeCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { code: string }) => exchangeCode(payload.code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
}

export function useSetSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { accessToken: string; refreshToken: string }) =>
      setSession(payload.accessToken, payload.refreshToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { password: string }) => resetPassword(payload.password),
  });
}
