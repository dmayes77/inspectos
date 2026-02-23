import type { ApiClient } from "./client";

export function createAuthApi(apiClient: ApiClient) {
  return {
    login: <T>(email: string, password: string) =>
      apiClient.post<T>("/auth/login", { email, password }),
    logout: <T>() => apiClient.post<T>("/auth/logout", {}),
    getSession: <T>() => apiClient.get<T>("/auth/session"),
    signup: <T>(payload: {
      email: string;
      password: string;
      full_name: string;
      email_redirect_to?: string;
    }) => apiClient.post<T>("/auth/signup", payload),
    resendConfirmation: <T>(email: string, emailRedirectTo?: string) =>
      apiClient.post<T>("/auth/resend", { email, email_redirect_to: emailRedirectTo }),
    requestPasswordReset: <T>(email: string, redirectTo: string) =>
      apiClient.post<T>("/auth/forgot-password", { email, redirect_to: redirectTo }),
    confirmOtp: <T>(tokenHash: string, type: string) =>
      apiClient.post<T>("/auth/confirm", { token_hash: tokenHash, type }),
    exchangeCode: <T>(code: string) => apiClient.post<T>("/auth/exchange-code", { code }),
    setSession: <T>(accessToken: string, refreshToken: string) =>
      apiClient.post<T>("/auth/set-session", { access_token: accessToken, refresh_token: refreshToken }),
    resetPassword: <T>(password: string) => apiClient.post<T>("/auth/reset-password", { password }),
  };
}
