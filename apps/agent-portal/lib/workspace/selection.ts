export const ACTIVE_WORKSPACE_STORAGE_KEY = "agent_portal_active_workspace_slug";
const ACTIVE_WORKSPACE_COOKIE_KEY = "agent_portal_workspace_slug";

export function getStoredWorkspaceSlug(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
  if (fromLocal) return fromLocal;
  const fromCookie = document.cookie
    .split("; ")
    .find((value) => value.startsWith(`${ACTIVE_WORKSPACE_COOKIE_KEY}=`))
    ?.split("=")[1];
  return fromCookie ? decodeURIComponent(fromCookie) : null;
}

export function setStoredWorkspaceSlug(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, slug);
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE_KEY}=${encodeURIComponent(slug)}; path=/; max-age=2592000; samesite=lax`;
}

export function clearStoredWorkspaceSlug(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
  document.cookie = `${ACTIVE_WORKSPACE_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
}
