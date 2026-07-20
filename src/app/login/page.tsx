'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email);
        setSuccess('Login realizado! Redirecionando...');
      } else {
        if (!name) { setError('Nome é obrigatório.'); setLoading(false); return; }
        await register(email, name, role);
        setSuccess('Conta criada! Redirecionando...');
      }

      const userStr = localStorage.getItem('maeum_session');
      const user = userStr ? JSON.parse(userStr) : null;

      setTimeout(() => {
        if (user?.role === 'super_admin' || user?.role === 'admin') router.push('/dashboard/admin');
        else if (user?.role === 'consultora') router.push('/dashboard/consultora');
        else router.push('/dashboard/cliente');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold tracking-widest text-primary uppercase">MaeumGlobal</h1>
            <p className="text-xs text-muted-foreground mt-1 font-semibold tracking-wider uppercase">Portal de Administração</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-5 flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded-xl mb-5 flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex bg-muted rounded-full p-1 mb-6 border border-border">
            <button onClick={() => setMode('login')} className={`flex-1 text-center py-2.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all ${mode === 'login' ? 'bg-primary text-white shadow-md' : 'hover:text-secondary text-muted-foreground'}`}>Entrar</button>
            <button onClick={() => setMode('register')} className={`flex-1 text-center py-2.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all ${mode === 'register' ? 'bg-primary text-white shadow-md' : 'hover:text-secondary text-muted-foreground'}`}>Cadastrar</button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" className="pl-10 bg-background border-border rounded-xl text-xs h-11" />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-secondary">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60" />
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 bg-background border-border rounded-xl text-xs h-11" />
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 bg-background border-border rounded-xl text-xs h-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-muted-foreground/60 hover:text-secondary">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary">Tipo de Perfil</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="flex h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-secondary">
                  <option value="customer">Cliente (Viajante)</option>
                  <option value="consultora">Consultora (B2B)</option>
                  <option value="super_admin">Administrador</option>
                </select>
              </div>
            )}

            <Button type="submit" disabled={loading} className="bg-primary hover:bg-accent-hover text-white font-bold py-3 rounded-xl text-sm mt-2">
              {loading ? 'Processando...' : mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-[10px] text-muted-foreground">
              {mode === 'login' ? (
                <>Não tem conta? <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="text-primary font-bold hover:underline">Cadastre-se</button></>
              ) : (
                <>Já tem conta? <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-primary font-bold hover:underline">Faça login</button></>
              )}
            </p>
          </div>
        </div>
      </div>

      <footer className="flex flex-col items-center justify-center gap-2 py-6 text-[10px] text-muted-foreground border-t border-border">
        <div className="flex gap-4">
          <Link href="/politica-de-privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link>
          <Link href="/termos-de-uso" className="hover:text-primary transition-colors">Termos de Uso</Link>
        </div>
        <div>&copy; {new Date().getFullYear()} MaeumGlobal. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}
