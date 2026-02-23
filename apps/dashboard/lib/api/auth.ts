const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const AUTH_REQUEST_TIMEOUT_MS = 10000;

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message?: string } };

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Authentication request timed out. Check that the API is running.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> | { error?: string };
  const envelope = payload as Partial<{ success: boolean; data: T; error: { message?: string } }>;

  if (!response.ok) {
    const message = envelope.error?.message || (payload as { error?: string }).error;
    throw new Error(message || "Authentication request failed.");
  }

  if (envelope.success === true && envelope.data !== undefined) {
    return envelope.data;
  }

  return payload as T;
}

export function login(email: string, password: string) {
  return authFetch<{ user: { id: string | null; email: string | null } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return authFetch<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
}

export function getSession() {
  return authFetch<{ user: { id: string; email: string | null } }>("/auth/session", {
    method: "GET",
  });
}

export function signup(payload: {
  email: string;
  password: string;
  full_name: string;
  email_redirect_to?: string;
}) {
  return authFetch<{
    requires_email_confirmation: boolean;
    user: { id: string | null; email: string | null };
  }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resendConfirmation(email: string, emailRedirectTo?: string) {
  return authFetch<{ sent: boolean }>("/auth/resend", {
    method: "POST",
    body: JSON.stringify({ email, email_redirect_to: emailRedirectTo }),
  });
}

export function requestPasswordReset(email: string, redirectTo: string) {
  return authFetch<{ sent: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
}

export function confirmOtp(tokenHash: string, type: string) {
  return authFetch<{ redirect_to: string; type: string }>("/auth/confirm", {
    method: "POST",
    body: JSON.stringify({ token_hash: tokenHash, type }),
  });
}

export function exchangeCode(code: string) {
  return authFetch<{ user: { id: string | null; email: string | null } }>("/auth/exchange-code", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function setSession(accessToken: string, refreshToken: string) {
  return authFetch<{ user: { id: string | null; email: string | null } }>("/auth/set-session", {
    method: "POST",
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
  });
}

export function resetPassword(password: string) {
  return authFetch<{ updated: boolean }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
