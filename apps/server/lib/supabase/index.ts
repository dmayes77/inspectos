import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Only enable BYPASS_AUTH in development mode for security
// Supports: local dev, Vercel preview, and custom dev deployments (dev.inspectos.co)
const IS_DEVELOPMENT =
  process.env.NODE_ENV === 'development' ||
  process.env.VERCEL_ENV === 'preview' ||
  process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true';
const BYPASS_AUTH = IS_DEVELOPMENT && process.env.BYPASS_AUTH === 'true';
const BYPASS_USER = { userId: 'bypass-user', email: 'bypass@example.com' };

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
  if (BYPASS_AUTH) {
    return createServiceClient();
  }
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

// Extract user ID from JWT (simple decode, not verification - Supabase verifies)
export function getUserFromToken(accessToken: string): { userId: string; email?: string } | null {
  if (BYPASS_AUTH) {
    return BYPASS_USER;
  }
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
  if (BYPASS_AUTH) {
    return 'bypass-token';
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

// Re-export standardized error responses from api-response
// for backwards compatibility - new code should import from './api-response'
export {
  unauthorized,
  badRequest,
  serverError,
  success,
  forbidden,
  notFound,
  validationError,
  rateLimited,
} from '../api-response';
