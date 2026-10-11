'use client';

/**
 * Modal de autenticação — 4 modos reais, todos executados por `authActions.ts`:
 *   login | register | forgot | change (e `reset`, disparado por ?reset=<token>)
 *
 * NÃO existe OAuth configurado no projeto: o botão do Google aparece
 * desabilitado e nunca simula sucesso.
 */

import { useCallback, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { X, Mail, Lock, User, Phone, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'change';

/** Assina mudanças de URL (pushState do Next Router, back/forward, hash). */
function subscribeToLocation(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
  };
}

const getLocationSearch = () => (typeof window === 'undefined' ? '' : window.location.search);
const getServerLocationSearch = () => '';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Modo inicial. `page` renderiza como página inteira (sem overlay). */
  defaultMode?: Exclude<AuthMode, 'reset'> | 'reset';
  /** `page` = sem fundo/overlay; `modal` = modal sobre a página. */
  presentation?: 'modal' | 'page';
  title?: string;
  subtitle?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'login',
  presentation = 'modal',
  title,
  subtitle,
}: AuthModalProps) {
  const { t } = useLanguage();
  const {
    login,
    register,
    requestPasswordReset,
    resetPassword,
    changePassword,
    pending,
  } = useAuth();

  const [requestedMode, setRequestedMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isPage = presentation === 'page';

  /*
   * Modo efetivo = DERIVADO, nunca copiado em efeito:
   *  · quando o pai reabre o modal, `defaultMode` volta a valer (ajuste no render);
   *  · um `?reset=<token>` na URL tem prioridade sobre o modo pedido — o token é
   *    lido de `location.search` como external store, evitando setState em efeito.
   */
  const [lastDefaultMode, setLastDefaultMode] = useState(defaultMode);
  const [lastIsOpen, setLastIsOpen] = useState(isOpen);
  if (lastIsOpen !== isOpen || lastDefaultMode !== defaultMode) {
    setLastIsOpen(isOpen);
    setLastDefaultMode(defaultMode);
    if (isOpen) setRequestedMode(defaultMode);
  }

  const locationSearch = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    getServerLocationSearch,
  );
  const urlToken = useMemo(() => {
    if (!locationSearch) return '';
    const raw = new URLSearchParams(locationSearch).get('reset');
    return raw && raw.length >= 20 ? raw : '';
  }, [locationSearch]);

  const mode: AuthMode = urlToken ? 'reset' : requestedMode;
  const token = urlToken;

  const setMode = useCallback((next: AuthMode) => {
    setRequestedMode(next);
  }, []);

  const busy = pending;

  if (!isOpen) return null;

  const heading = (): string => {
    switch (mode) {
      case 'login':
        return t('Entrar na Conta');
      case 'register':
        return t('Criar Nova Conta');
      case 'forgot':
        return t('Esqueci minha senha');
      case 'reset':
        return t('Redefinir Senha');
      default:
        return t('Alterar Senha');
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode !== 'forgot' && mode !== 'reset' && password !== confirmPassword && confirmPassword !== '') {
      setErrorMsg(t('A Senhas Não Coincidem'));
      return;
    }

    if (mode === 'login') {
      const result = await login(email, password);
      if (!result.success) {
        setErrorMsg(result.error ?? t('Falha na conexão. Tente novamente.'));
        return;
      }
      setSuccessMsg(t('Sessão iniciada com sucesso!'));
      onSuccess?.();
      onClose();
      return;
    }

    if (mode === 'register') {
      const result = await register({ name, email, password, phone });
      if (!result.success) {
        setErrorMsg(result.error ?? t('O nome é obrigatório.'));
        return;
      }
      setSuccessMsg(t('Cadastro realizado com sucesso!'));
      onSuccess?.();
      onClose();
      return;
    }

    if (mode === 'forgot') {
      const result = await requestPasswordReset(email);
      // Mensagem genérica por definição (não revela se o e-mail existe).
      setSuccessMsg(result.error ?? t('Se o e-mail existir, enviaremos o link de redefinição.'));
      return;
    }

    if (mode === 'reset') {
      const result = await resetPassword(token, password);
      if (!result.success) {
        setErrorMsg(result.error ?? t('Falha na conexão. Tente novamente.'));
        return;
      }
      setSuccessMsg(t('Sessão iniciada com sucesso!'));
      onSuccess?.();
      onClose();
      return;
    }

    const result = await changePassword(currentPassword, password);
    if (!result.success) {
      setErrorMsg(result.error ?? t('Falha na conexão. Tente novamente.'));
      return;
    }
    setSuccessMsg(t('Sessão encerrada com sucesso.'));
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
  };

  const panel = (
    <div
      className={`relative w-full max-w-md border border-border bg-card p-6 shadow-2xl text-xs text-muted-foreground md:p-8 ${
        isPage ? 'rounded-3xl' : 'animate-in fade-in zoom-in-95 rounded-3xl duration-200 my-8'
      }`}
      role="dialog"
      aria-modal={isPage ? undefined : true}
      aria-labelledby="auth-modal-title"
    >
      {!isPage && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-secondary"
          aria-label={t('Fechar')}
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="mb-6 text-center">
        <span className="block font-heading text-lg font-bold uppercase tracking-widest text-primary">
          {title ?? t('MAEUM PORTAL')}
        </span>
        <span
          id="auth-modal-title"
          className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          {subtitle ?? heading()}
        </span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 font-bold text-green-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {mode === 'login' || mode === 'register' ? (
        <div className="mb-6 flex rounded-full border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            aria-pressed={mode === 'login'}
            className={`flex-1 rounded-full py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all ${
              mode === 'login' ? 'bg-primary text-white shadow-md' : 'hover:text-secondary'
            }`}
          >
            {t('Login')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            aria-pressed={mode === 'register'}
            className={`flex-1 rounded-full py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all ${
              mode === 'register' ? 'bg-primary text-white shadow-md' : 'hover:text-secondary'
            }`}
          >
            {t('Cadastrar')}
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-name" className="text-[10px] font-semibold text-secondary">
                {t('Nome Completo')}
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <Input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('Seu Nome Completo')}
                  className="h-10 rounded-xl border-border bg-background pl-9 text-xs text-secondary"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-phone" className="text-[10px] font-semibold text-secondary">
                {t('WhatsApp')} ({t('opcional')})
              </label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <Input
                  id="auth-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 11 90000-0000"
                  className="h-10 rounded-xl border-border bg-background pl-9 text-xs text-secondary"
                />
              </div>
            </div>
          </>
        )}

        {mode !== 'change' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-email" className="text-[10px] font-semibold text-secondary">
              {t('E-mail')}
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/60"
                aria-hidden="true"
              />
              <Input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@dominio.com"
                className="h-10 rounded-xl border-border bg-background pl-9 text-xs text-secondary"
              />
            </div>
          </div>
        )}

        {mode === 'change' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-current-password" className="text-[10px] font-semibold text-secondary">
              {t('Senha Atual')}
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/60"
                aria-hidden="true"
              />
              <Input
                id="auth-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 rounded-xl border-border bg-background pl-9 text-xs text-secondary"
              />
            </div>
          </div>
        )}

        {mode !== 'forgot' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="auth-password" className="text-[10px] font-semibold text-secondary">
                {mode === 'login' ? t('Senha') : t('Nova Senha')}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[9px] font-bold text-primary hover:underline"
                >
                  {t('Esqueceu sua senha?')}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/60"
                aria-hidden="true"
              />
              <Input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'login' ? undefined : 8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-describedby={mode === 'login' ? undefined : 'auth-password-hint'}
                className="h-10 rounded-xl border-border bg-background pl-9 text-xs text-secondary"
              />
            </div>
            {mode !== 'login' && (
              <p id="auth-password-hint" className="text-[9px] text-muted-foreground">
                {t('A nova senha precisa ter ao menos 8 caracteres.')}
              </p>
            )}
          </div>
        )}

        {mode !== 'forgot' && mode !== 'login' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-confirm-password" className="text-[10px] font-semibold text-secondary">
              {t('Confirmar Nova Senha')}
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground/60"
                aria-hidden="true"
              />
              <Input
                id="auth-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 rounded-xl border-border bg-background pl-9 text-xs text-secondary"
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="mt-2 rounded-xl bg-primary py-2.5 font-bold text-white hover:bg-accent-hover"
        >
          {busy
            ? t('Processando...')
            : mode === 'login'
              ? t('ENTRAR')
              : mode === 'register'
                ? t('CRIAR CONTA')
                : mode === 'forgot'
                  ? t('ENVIAR EMAIL')
                  : mode === 'reset'
                    ? t('Redefinir Senha')
                    : t('Alterar minha senha')}
        </Button>
      </form>

      {mode === 'login' && (
        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6">
          <div className="relative flex items-center justify-center py-1">
            <div className="flex-grow border-t border-border" />
            <span className="mx-4 flex-shrink text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('Ou continuar com')}
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* Não há OAuth configurado neste projeto: botão visivelmente
              desabilitado, sem simular sucesso. */}
          <Button
            type="button"
            disabled
            aria-disabled="true"
            title={t('O login social está indisponível por enquanto.')}
            className="h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border-border py-2.5 text-xs text-secondary opacity-60"
          >
            <svg
              className="mr-1 h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.6 -0.06,-1.2 -0.17,-1.72Z"
                fill="#4285F4"
              />
              <path
                d="M12,20.62c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.98 -3.3,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.7H2.92v2.66c1.5,2.98 4.6,4.82 8.08,4.82Z"
                fill="#34A853"
              />
              <path
                d="M6.96,13.22c-0.18,-0.54 -0.28,-1.12 -0.28,-1.72c0,-0.6 0.1,-1.18 0.28,-1.72V7.12H2.92c-0.6,1.2 -0.92,2.56 -0.92,4.38c0,1.82 0.32,3.18 0.92,4.38l4.04,-3.26Z"
                fill="#FBBC05"
              />
              <path
                d="M12,6.16c1.32,0 2.5,0.46 3.44,1.36l2.58,-2.58C16.46,3.48 14.42,2.78 12,2.78c-3.48,0 -6.58,1.84 -8.08,4.82l4.04,3.26c0.71,-2.12 2.7,-3.7 5.04,-3.7Z"
                fill="#EA4335"
              />
            </svg>
            {t('Continuar com Google')}
            <span className="text-[9px] font-bold uppercase text-muted-foreground">
              {t('Indisponível neste momento')}
            </span>
          </Button>
        </div>
      )}

      {mode === 'forgot' && (
        <button
          type="button"
          onClick={() => switchMode('login')}
          className="mt-4 w-full text-center text-[10px] font-bold text-primary hover:underline"
        >
          {t('Voltar para o login')}
        </button>
      )}

      {mode === 'reset' && (
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('reset');
              window.history.replaceState({}, '', url.toString());
              // Notifica os assinantes de `location` (este componente incluso).
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
            switchMode('login');
          }}
          className="mt-4 w-full text-center text-[10px] font-bold text-primary hover:underline"
        >
          {t('Voltar para o login')}
        </button>
      )}

      {mode === 'change' && (
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-[10px] font-bold text-primary hover:underline"
        >
          {t('Voltar ao portal')}
        </button>
      )}

      <p className="mt-6 text-center text-[9px] text-muted-foreground">
        {t('Ainda não tem conta?')}{' '}
        {mode === 'register' ? (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="font-bold text-primary hover:underline"
          >
            {t('Login')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode('register')}
            className="font-bold text-primary hover:underline"
          >
            {t('Criar conta')}
          </button>
        )}
      </p>
    </div>
  );

  if (isPage) return panel;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {panel}
    </div>
  );
}