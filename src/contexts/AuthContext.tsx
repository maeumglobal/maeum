'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/supabaseAuth';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, name: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = authService.getCurrentUser();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    const data = await authService.signIn(email, password);
    if (data?.user) setUser(data.user as AuthUser);
  }, []);

  const register = useCallback(async (email: string, name: string, role: string) => {
    const data = await authService.signUp(email, name, role);
    if (data?.user) setUser(data.user as AuthUser);
  }, []);

  const logout = useCallback(() => {
    authService.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
