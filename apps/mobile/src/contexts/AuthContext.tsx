import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { database } from '../db';
import { syncService } from '../sync';

// SECURITY: Auth bypass is ONLY allowed in development mode
// Both DEV mode AND explicit env var must be true
const BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true';
const DEV_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

if (BYPASS_AUTH) {
  console.warn('[Auth] ⚠️ Auth bypass is enabled - DO NOT use in production');
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  selectTenant: (tenantSlug: string) => Promise<void>;
  refreshTenants: () => Promise<TenantInfo[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    tenant: null,
    isLoading: true,
    isInitialized: false,
    error: null,
  });

  useEffect(() => {
    if (!BYPASS_AUTH) return;
    const devUser = { id: DEV_USER_ID, email: 'dev@inspectos.local' } as User;
    const devTenant: TenantInfo = {
      id: DEV_TENANT_ID,
      name: 'InspectOS Dev',
      slug: 'dev',
      role: 'owner',
    };

    setState(s => ({
      ...s,
      user: devUser,
      session: null,
      tenant: devTenant,
      isLoading: false,
      isInitialized: true,
      error: null,
    }));
  }, []);

  // Initialize database on mount
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await database.initialize();
        console.log('[Auth] Database initialized');
      } catch (error) {
        console.error('[Auth] Database init failed:', error);
        setState(s => ({ ...s, error: 'Failed to initialize database' }));
      }
    };

    initDatabase();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    if (BYPASS_AUTH) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(s => ({
        ...s,
        session,
        user: session?.user ?? null,
        isLoading: false,
        isInitialized: true,
      }));
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        setState(s => ({
          ...s,
          session,
          user: session?.user ?? null,
          isLoading: false,
        }));

        // Clear tenant on sign out
        if (event === 'SIGNED_OUT') {
          setState(s => ({ ...s, tenant: null }));
          syncService.stopAutoSync();
          syncService.clearCredentials();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Keep sync service credentials current (token refreshes, app restore, etc.)
  useEffect(() => {
    if (BYPASS_AUTH) return;

    const refreshSyncCredentials = async () => {
      if (!state.session?.access_token || !state.tenant?.slug) return;
      try {
        await syncService.initialize(state.session.access_token, state.tenant.slug);
      } catch (error) {
        console.error('[Auth] Sync credential refresh failed:', error);
      }
    };

    refreshSyncCredentials();
  }, [state.session?.access_token, state.tenant?.slug]);

  const selectTenant = useCallback(async (tenantSlug: string) => {
    if (BYPASS_AUTH) {
      setState(s => ({
        ...s,
        tenant: {
          id: DEV_TENANT_ID,
          name: 'InspectOS Dev',
          slug: tenantSlug,
          role: 'owner',
        },
        isLoading: false,
        error: null,
      }));
      return;
    }

    if (!state.session?.access_token) {
      throw new Error('Not authenticated');
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      // Verify membership
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('slug', tenantSlug)
        .single();

      if (tenantError || !tenant) {
        throw new Error('Tenant not found');
      }

      const { data: membership, error: membershipError } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', tenant.id)
        .eq('user_id', state.user!.id)
        .single();

      if (membershipError || !membership) {
        throw new Error('Not a member of this tenant');
      }

      const tenantInfo: TenantInfo = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: membership.role,
      };

      // Save last tenant
      await database.run(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
        ['last_tenant_slug', tenantSlug, new Date().toISOString()]
      );

      // Initialize sync service
      await syncService.initialize(state.session.access_token, tenantSlug);
      syncService.setTenantId(tenant.id);

      // Bootstrap sync (download data for offline)
      await syncService.bootstrap();

      // Start auto-sync
      syncService.startAutoSync(30000);

      setState(s => ({ ...s, tenant: tenantInfo, isLoading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to select tenant';
      setState(s => ({ ...s, error: message, isLoading: false }));
      throw error;
    }
  }, [state.session, state.user]);

  // Auto-select last tenant on login
  useEffect(() => {
    if (BYPASS_AUTH) return;

    const autoSelectTenant = async () => {
      if (!state.user || state.tenant) return;

      try {
        // Check for last tenant in local storage
        const { data: settings } = await database.query<{ value: string }>(
          `SELECT value FROM app_settings WHERE key = 'last_tenant_slug'`
        );
        const lastTenantSlug = settings[0]?.value;

        if (lastTenantSlug) {
          await selectTenant(lastTenantSlug);
        }
      } catch (error) {
        console.error('[Auth] Auto-select tenant failed:', error);
      }
    };

    autoSelectTenant();
  }, [state.user, state.tenant, selectTenant]);

  const refreshTenants = useCallback(async (): Promise<TenantInfo[]> => {
    if (BYPASS_AUTH) {
      return [
        {
          id: DEV_TENANT_ID,
          name: 'InspectOS Dev',
          slug: 'dev',
          role: 'owner',
        },
      ];
    }

    if (!state.user) return [];

    const { data: memberships } = await supabase
      .from('tenant_members')
      .select(`
        role,
        tenant:tenants (id, name, slug)
      `)
      .eq('user_id', state.user.id);

    return (memberships || []).map(m => ({
      id: (m.tenant as { id: string }).id,
      name: (m.tenant as { name: string }).name,
      slug: (m.tenant as { slug: string }).slug,
      role: m.role,
    }));
  }, [state.user]);

  const signOut = useCallback(async () => {
    syncService.stopAutoSync();
    syncService.clearCredentials();
    if (!BYPASS_AUTH) {
      await supabase.auth.signOut();
    }
    setState(s => ({ ...s, user: null, session: null, tenant: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signOut,
        selectTenant,
        refreshTenants,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
