import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api';
import type { AuthResponse, Role, UserInfo } from '../lib/types';

export interface CandidateSignup { fullName: string; email: string; phone: string; password: string }
export interface EmployerSignup extends CandidateSignup { companyName: string; city: string; state: string }

interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserInfo>;
  registerCandidate: (payload: CandidateSignup) => Promise<UserInfo>;
  registerEmployer: (payload: EmployerSignup) => Promise<UserInfo>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const homePath = (role: Role): string =>
  role === 'ADMIN' ? '/admin' : role === 'EMPLOYER' ? '/employer' : '/candidate';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(() => tokenStore.get() !== null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.get<UserInfo>('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const accept = useCallback((res: AuthResponse) => {
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (email, password) => accept(await api.post<AuthResponse>('/auth/login', { email, password })),
      registerCandidate: async (payload) => accept(await api.post<AuthResponse>('/auth/register/candidate', payload)),
      registerEmployer: async (payload) => accept(await api.post<AuthResponse>('/auth/register/employer', payload)),
      logout,
    }),
    [user, loading, accept, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
