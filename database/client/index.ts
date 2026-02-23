import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  accessToken?: string;
  storage?: any; // For mobile Capacitor storage
}

export interface ServiceClientConfig {
  url: string;
  serviceRoleKey: string;
}

/**
 * Create a Supabase client for user-authenticated requests
 * Works for web (browser), server (with JWT), and mobile (with Capacitor storage)
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  const clientConfig: any = {
    auth: {
      persistSession: !!config.storage,
      autoRefreshToken: !!config.storage,
      detectSessionInUrl: !!config.storage, // Enable URL detection for web browser
    }
  };

  // Add custom storage for mobile or browser
  if (config.storage) {
    clientConfig.auth.storage = config.storage;
  }

  // Add JWT token for authenticated requests (server-side)
  if (config.accessToken) {
    clientConfig.global = {
      headers: {
        Authorization: `Bearer ${config.accessToken}`
      }
    };
    clientConfig.auth.autoRefreshToken = false;
    clientConfig.auth.persistSession = false;
  }

  return createClient(config.url, config.anonKey, clientConfig);
}

/**
 * Create a Supabase service client with service role key (bypasses RLS)
 * Only use on server-side for admin operations
 */
export function createServiceClient(config: ServiceClientConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Type helper for Supabase client
 */
export type { SupabaseClient };
