/**
 * Server-side auth helpers
 * Used by API server for JWT validation
 */

import { jwtVerify } from 'jose';

export interface DecodedToken {
  sub: string; // user_id
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

/**
 * Decode and verify JWT token
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<DecodedToken | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return {
      sub: payload.sub!,
      email: payload.email as string | undefined,
      role: payload.role as string | undefined,
      aud: payload.aud as string | undefined,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

/**
 * Simple JWT decode (no verification) for quick user ID extraction
 * Use verifyJWT for actual authentication
 */
export function decodeJWTUnsafe(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      aud: payload.aud,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}
