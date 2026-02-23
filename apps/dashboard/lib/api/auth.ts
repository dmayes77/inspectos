const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const AUTH_REQUEST_TIMEOUT_MS = 10000;
const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message?: string } };

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = init?.method || "GET";
  const startedAt = Date.now();

  if (AUTH_DEBUG) {
    console.info("[authFetch] request", {
      method,
      url,
      hasBody: Boolean(init?.body),
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    if (AUTH_DEBUG) {
      console.error("[authFetch] network error", {
        method,
        url,
        elapsedMs: Date.now() - startedAt,
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      });
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Authentication request timed out. Check that the API is running.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (AUTH_DEBUG) {
    console.info("[authFetch] response", {
      method,
      url,
      status: response.status,
      ok: response.ok,
      elapsedMs: Date.now() - startedAt,
      acao: response.headers.get("access-control-allow-origin"),
      vary: response.headers.get("vary"),
    });
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
  return authFetch<{ user: { id: string; email: string | null } | null }>("/auth/session", {
    method: "GET",
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("session expired")) {
      return { user: null };
    }
    throw error;
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
