'use client';

/**
 * Estado de autenticação do cliente.
 *
 * CONTRATO DE SEGURANÇA: aqui não existe `localStorage`. A sessão vive num
 * cookie HttpOnly assinado por `src/lib/session.ts` e é revalidada no Postgres
 * por `getAuth()` (src/lib/auth.ts). O `user` aqui é apenas uma cópia de
 * leitura para a UI — nenhuma decisão de autorização é tomada a partir dele
 * (o servidor revalida tudo).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Role } from '@/lib/session';
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  changePasswordAction,
  logoutAction,
  type AuthResult,
} from '@/actions/authActions';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  locale: string;
  /** Alias de compatibilidade: componentes legados ainda leem `avatar_url`. */
  readonly avatar_url: string | null;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** `true` enquanto há uma server action de autenticação em andamento. */
  pending: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (token: string, password: string) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  /** Relê a sessão no servidor (usar após login/registro/logout). */
  refresh: () => Promise<void>;
}

type AuthAction = (prev: AuthResult | null, formData: FormData) => Promise<AuthResult>;

const STAFF_ROLES: readonly Role[] = ['super_admin', 'admin', 'consultora'];
const ADMIN_ROLES: readonly Role[] = ['super_admin', 'admin'];

const INITIAL_VALUE: AuthContextValue = {
  user: null,
  loading: true,
  pending: false,
  isAuthenticated: false,
  isStaff: false,
  isAdmin: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  requestPasswordReset: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  changePassword: async () => ({ success: false }),
  logout: async () => {},
  refresh: async () => {},
};

const AuthContext = createContext<AuthContextValue>(INITIAL_VALUE);

type RawUser = Omit<AuthUser, 'avatar_url'>;

/**
 * Expõe `avatar_url` como getter (compatibilidade com componentes antigos sem
 * duplicar o dado no payload).
 */
function decorate(raw: RawUser): AuthUser {
  const user = { ...raw } as AuthUser;
  Object.defineProperty(user, 'avatar_url', {
    get: () => user.avatarUrl ?? null,
    enumerable: true,
    configurable: true,
  });
  return user;
}

function toFormData(fields: Record<string, string | undefined>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && value.length > 0) data.set(key, value);
  }
  return data;
}

function normalizeUser(value: unknown): RawUser | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string' || typeof raw.email !== 'string') return null;
  const role: Role =
    raw.role === 'super_admin' || raw.role === 'admin' || raw.role === 'consultora' || raw.role === 'customer'
      ? raw.role
      : 'customer';
  return {
    id: raw.id,
    email: raw.email,
    name: typeof raw.name === 'string' ? raw.name : '',
    role,
    phone: typeof raw.phone === 'string' ? raw.phone : null,
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : null,
    jobTitle: typeof raw.jobTitle === 'string' ? raw.jobTitle : null,
    locale: typeof raw.locale === 'string' ? raw.locale : 'pt',
  };
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  /**
   * Injetado pelo layout servidor. Quando `undefined`, o provider busca
   * `/api/me` uma única vez no mount.
   */
  initialUser?: RawUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(
    initialUser ? decorate(initialUser) : null,
  );
  const [loading, setLoading] = useState(initialUser === undefined);
  const [isPending, setIsPending] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const payload = (await response.json()) as { user?: unknown };
      const normalized = normalizeUser(payload?.user);
      setUser(normalized ? decorate(normalized) : null);
    } catch {
      setUser(null);
    }
  }, []);

  /*
   * `loading` já nasce correto: quando o layout injetou `initialUser` não há nada
   * a buscar, então o efeito não precisa ligar o spinner (o que dispararia um
   * render em cascata).
   */
  useEffect(() => {
    if (initialUser !== undefined) return;
    let active = true;
    void (async () => {
      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [initialUser, load]);

  const callAction = useCallback(
    async (action: AuthAction, fields: Record<string, string | undefined>): Promise<AuthResult> => {
      setIsPending(true);
      try {
        const result = await action(null, toFormData(fields));
        return {
          success: Boolean(result?.success),
          ...(result?.error ? { error: result.error } : {}),
          ...(result?.redirectTo ? { redirectTo: result.redirectTo } : {}),
        };
      } catch {
        return { success: false };
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const result = await callAction(loginAction, { email, password });
      if (result.success) await load();
      return result;
    },
    [callAction, load],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthResult> => {
      const result = await callAction(registerAction, {
        name: input.name,
        email: input.email,
        password: input.password,
        phone: input.phone,
      });
      if (result.success) await load();
      return result;
    },
    [callAction, load],
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<AuthResult> =>
      callAction(requestPasswordResetAction, { email }),
    [callAction],
  );

  const resetPassword = useCallback(
    async (token: string, password: string): Promise<AuthResult> => {
      const result = await callAction(resetPasswordAction, { token, password });
      if (result.success) await load();
      return result;
    },
    [callAction, load],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
      const result = await callAction(changePasswordAction, {
        currentPassword,
        newPassword,
      });
      if (result.success) await load();
      return result;
    },
    [callAction, load],
  );

  const logout = useCallback(async (): Promise<void> => {
    // Limpa a UI imediatamente: o cookie HttpOnly continua válido até a action
    // terminar, mas a interface já não deve mostrar uma sessão encerrada.
    setUser(null);
    try {
      await logoutAction();
    } catch {
      // `logoutAction()` chama `redirect('/')`; o erro de redirect do Next é
      // esperado e o estado local já está limpo acima.
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = user?.role ?? null;
    return {
      user,
      loading,
      pending: isPending,
      isAuthenticated: user !== null,
      isStaff: !!role && STAFF_ROLES.includes(role),
      isAdmin: !!role && ADMIN_ROLES.includes(role),
      login,
      register,
      requestPasswordReset,
      resetPassword,
      changePassword,
      logout,
      refresh: load,
    };
  }, [
    user,
    loading,
    isPending,
    login,
    register,
    requestPasswordReset,
    resetPassword,
    changePassword,
    logout,
    load,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export default AuthProvider;