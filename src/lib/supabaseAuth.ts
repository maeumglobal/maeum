import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock list of fallback users matching the seed database
const MOCK_USERS_MAEUM = [
  { id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', email: 'admin@maeum.com', name: 'Super Administrador Maeum', role: 'super_admin' },
  { id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', email: 'consultora1@maeum.com', name: 'Mariana Santos', role: 'consultora' },
  { id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', email: 'cliente@maeum.com', name: 'Bruno Almeida', role: 'customer' }
];

export const authService = {
  async signUp(email: string, name: string, role: string = 'customer') {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: {
          data: { name, role }
        }
      });
      if (error) throw error;
      return data;
    } else {
      // Local fallback simulation
      const newUser = { id: crypto.randomUUID(), email, name, role };
      localStorage.setItem('maeum_session', JSON.stringify(newUser));
      return { user: newUser };
    }
  },

  async signIn(email: string) {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123'
      });
      if (error) throw error;
      return data;
    } else {
      // Local fallback search matching seed list
      const matched = MOCK_USERS_MAEUM.find(u => u.email.toLowerCase() === email.toLowerCase());
      const userSession = matched || { id: crypto.randomUUID(), email, name: email.split('@')[0], role: 'customer' };
      localStorage.setItem('maeum_session', JSON.stringify(userSession));
      return { user: userSession };
    }
  },

  async signInWithGoogle() {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      return data;
    } else {
      // Local fallback simulator for Google OAuth button
      const googleUser = { id: crypto.randomUUID(), email: 'google.user@gmail.com', name: 'Google Client User', role: 'customer' };
      localStorage.setItem('maeum_session', JSON.stringify(googleUser));
      return { user: googleUser };
    }
  },

  async signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('maeum_session');
  },

  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('maeum_session');
    return saved ? JSON.parse(saved) : null;
  }
};
