/**
 * Client-side auth helpers
 * Used by web and mobile apps
 */

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

/**
 * Extract user from session
 */
export function getUserFromSession(session: Session | null): User | null {
  return session?.user ?? null;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;
  return Date.now() > session.expires_at * 1000;
}

/**
 * Get access token from session
 */
export function getAccessToken(session: Session | null): string | null {
  if (!session || isSessionExpired(session)) return null;
  return session.access_token;
}
