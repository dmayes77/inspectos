import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role (bypasses RLS)
// Used for seed routes and admin operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
