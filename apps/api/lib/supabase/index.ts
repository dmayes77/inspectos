import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { assertNoProdAuthBypass } from '@/lib/security/env-guard';
import { ACCESS_COOKIE_NAME } from '@/lib/auth/session-cookies';

assertNoProdAuthBypass();

// Server-side Supabase client with service role (bypasses RLS)
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Server-side Supabase client with user's JWT (respects RLS)
export function createUserClient(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Server-side Supabase client with anon key for auth flows (sign in/up/reset/verify).
export function createAnonClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Extract user ID from JWT (simple decode, not verification - Supabase verifies)
export function getUserFromToken(accessToken: string): { userId: string; email?: string } | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));

    if (typeof decoded?.sub !== 'string') {
      return null;
    }

    return {
      userId: decoded.sub,
      email: decoded.email
    };
  } catch {
    return null;
  }
}

// Get access token from request headers
export function getAccessToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Prefer framework cookie API when available (NextRequest).
  const cookieStore = (request as { cookies?: { get: (name: string) => { value?: string } | undefined } }).cookies;
  const cookieToken = cookieStore?.get?.(ACCESS_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback: parse Cookie header manually.
  const cookieHeader = request.headers.get('cookie') ?? '';
  const escapedName = ACCESS_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]+)`));
  if (!match?.[1]) {
    return null;
  }
  return decodeURIComponent(match[1]);
}

// Re-export standardized error responses from api-response
// for backwards compatibility - new code should import from './api-response'
export {
  unauthorized,
  badRequest,
  paymentRequired,
  serverError,
  success,
  forbidden,
  notFound,
  validationError,
  rateLimited,
} from '../api-response';
