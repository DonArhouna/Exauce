import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setCsrfToken } from '../api/csrf';
import { setUnauthorizedHandler } from '../api/client';
import { adminActivate, adminLogin, adminLogout, adminMe } from '../api/endpoints/auth';
import type { AdminActivateRequest, AdminLoginRequest, AdminSessionUser } from '../api/types';
import { AuthContext, type AuthStatus } from './auth-context';

/** Fournit l'utilisateur courant et purge la session sur tout 401 global. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [sessionExpired, setSessionExpired] = useState(false);

  // Bootstrap : `GET /admin/auth/me` fait foi (cookie HttpOnly).
  useEffect(() => {
    let cancelled = false;
    adminMe()
      .then((response) => {
        if (cancelled) return;
        setUser(response.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 401 global : session expirée, purge du cache et redirection par la garde.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCsrfToken(null);
      setUser(null);
      setStatus('unauthenticated');
      setSessionExpired(true);
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  const login = useCallback(async (input: AdminLoginRequest) => {
    const response = await adminLogin(input);
    if (response.status === 'authenticated') {
      setUser(response.user);
      setStatus('authenticated');
      setSessionExpired(false);
      queryClient.clear();
    }
    return response;
  }, [queryClient]);

  const activate = useCallback(
    async (input: AdminActivateRequest) => {
      const response = await adminActivate(input);
      setUser(response.user);
      setStatus('authenticated');
      setSessionExpired(false);
      queryClient.clear();
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await adminLogout();
    } finally {
      setCsrfToken(null);
      setUser(null);
      setStatus('unauthenticated');
      setSessionExpired(false);
      queryClient.clear();
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    const response = await adminMe();
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const value = useMemo(
    () => ({
      status,
      user,
      permissions: user?.permissions ?? [],
      sessionExpired,
      login,
      activate,
      logout,
      refresh,
      clearSessionExpired,
    }),
    [status, user, sessionExpired, login, activate, logout, refresh, clearSessionExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
