/**
 * Web-specific Supabase client
 * Pre-instantiated client for browser environment
 */

import { createSupabaseClient } from '@inspectos/database/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isProduction =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

if (isProduction && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
  throw new Error("Security misconfiguration: NEXT_PUBLIC_BYPASS_AUTH=true is forbidden in production.");
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing');
}

/**
 * Singleton Supabase client for web app
 * Configured with browser auth persistence
 */
export const supabase = createSupabaseClient({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  // Browser environment - use localStorage for session persistence
  // During SSR (server-side), storage will be undefined which is fine
  storage: typeof window !== 'undefined' ? window.localStorage : (undefined as unknown as Storage),
});
