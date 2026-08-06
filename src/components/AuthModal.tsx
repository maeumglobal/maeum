'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/lib/supabaseAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, onSuccess, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer'); // customer, consultora, super_admin
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleOAuthGoogle = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await authService.signInWithGoogle();
      setSuccessMsg('✓ Conexão com Google simulada / autorizada!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro na autenticação com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        await authService.signIn(email, password);
        setSuccessMsg('✓ Sessão iniciada com sucesso!');
      } else if (mode === 'register') {
        if (!name) {
          setErrorMsg('O nome é obrigatório.');
          setLoading(false);
          return;
        }
        await authService.signUp(email, password, name, role);
        setSuccessMsg('✓ Cadastro realizado com sucesso!');
      } else {
        // Recovery
        setSuccessMsg('✓ Link de recuperação enviado para o seu e-mail!');
      }
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar requisição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-xs text-muted-foreground my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-secondary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-6">
          <span className="font-heading text-lg font-bold tracking-widest text-primary uppercase block">
            MAEUM PORTAL
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1 block">
            {mode === 'login' ? 'Entrar na Conta' : mode === 'register' ? 'Criar Nova Conta' : 'Recuperar Senha'}
          </span>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl mb-4 text-center font-bold">
            {successMsg}
          </div>
        )}

        {/* Tab Selector */}
        {mode !== 'recovery' && (
          <div className="flex bg-muted rounded-full p-1 mb-6 border border-border">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 text-center py-2 rounded-full font-bold uppercase tracking-wider text-[10px] transition-all ${
                mode === 'login' ? 'bg-primary text-white shadow-md' : 'hover:text-secondary'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 text-center py-2 rounded-full font-bold uppercase tracking-wider text-[10px] transition-all ${
                mode === 'register' ? 'bg-primary text-white shadow-md' : 'hover:text-secondary'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-secondary">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                <Input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu Nome Completo"
                  className="pl-9 bg-background border-border text-secondary rounded-xl text-xs h-10"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-secondary">Tipo de Perfil</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-secondary"
              >
                <option value="customer">Cliente (Viajante)</option>
                <option value="consultora">Consultora (B2B)</option>
                <option value="super_admin">Administrador (Agência)</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-secondary">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
              <Input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@dominio.com"
                className="pl-9 bg-background border-border text-secondary rounded-xl text-xs h-10"
              />
            </div>
          </div>

          {mode !== 'recovery' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-semibold text-secondary">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('recovery')}
                    className="text-[9px] hover:underline text-primary font-bold"
                  >
                    Esqueceu sua senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                <Input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 bg-background border-border text-secondary rounded-xl text-xs h-10"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-accent-hover text-white font-bold py-2.5 rounded-xl text-xs mt-2"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'ENTRAR' : mode === 'register' ? 'CRIAR CONTA' : 'ENVIAR EMAIL'}
          </Button>
        </form>

        {/* Social Auth Separator */}
        {mode !== 'recovery' && (
          <div className="flex flex-col gap-4 mt-6 border-t border-border pt-6">
            <div className="relative flex py-1 items-center justify-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Ou continuar com</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button
              type="button"
              onClick={handleOAuthGoogle}
              variant="outline"
              className="border-border hover:bg-muted text-secondary flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs h-10"
            >
              <svg className="h-4 w-4 mr-1 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.6 -0.06,-1.2 -0.17,-1.72Z" fill="#4285F4" />
                  <path d="M12,20.62c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.98 -3.3,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.7H2.92v2.66c1.5,2.98 4.6,4.82 8.08,4.82Z" fill="#34A853" />
                  <path d="M6.96,13.22c-0.18,-0.54 -0.28,-1.12 -0.28,-1.72c0,-0.6 0.1,-1.18 0.28,-1.72V7.12H2.92c-0.6,1.2 -0.92,2.56 -0.92,4.38c0,1.82 0.32,3.18 0.92,4.38l4.04,-3.26Z" fill="#FBBC05" />
                  <path d="M12,6.16c1.32,0 2.5,0.46 3.44,1.36l2.58,-2.58C16.46,3.48 14.42,2.78 12,2.78c-3.48,0 -6.58,1.84 -8.08,4.82l4.04,3.26c0.71,-2.12 2.7,-3.7 5.04,-3.7Z" fill="#EA4335" />
                </g>
              </svg>
              Continuar com Google
            </Button>
          </div>
        )}

        {mode === 'recovery' && (
          <button
            onClick={() => setMode('login')}
            className="w-full text-center hover:underline text-primary mt-4 text-[10px] font-bold"
          >
            Voltar para o login
          </button>
        )}
      </div>
    </div>
  );
}
