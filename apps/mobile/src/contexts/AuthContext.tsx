import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMobileSession, logout } from '../services/api';

type TenantInfo = {
  id: string;
  slug: string;
  name: string;
};

type UserInfo = {
  id: string;
  email: string | null;
  avatar_url?: string | null;
};

type AuthContextValue = {
  user: UserInfo | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const session = await fetchMobileSession();
      setUser(session.user);
      setTenant(session.tenant);
    } catch {
      setUser(null);
      setTenant(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await refreshSession();
      if (!cancelled) {
        setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tenant,
      isLoading,
      refreshSession,
      signOut: async () => {
        try {
          await logout();
        } catch (error) {
          console.warn('[Auth] Logout request failed, clearing local session anyway.', error);
        } finally {
          setUser(null);
          setTenant(null);
        }
      },
    }),
    [user, tenant, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
