'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, authService } from '@/lib/supabaseAuth';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let userRole = null;
        
        // Verifica no supabase online
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            userRole = session.user.user_metadata?.role;
          }
        }
        
        // Fallback local se estiver usando mock
        if (!userRole) {
          const localUser = authService.getCurrentUser();
          if (localUser) {
            userRole = localUser.role;
          }
        }

        // Regra de segurança: Apenas super_admin ou consultora
        if (userRole === 'super_admin' || userRole === 'consultora' || userRole === 'admin') {
          setIsAuthorized(true);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0F0A08] text-[#C8A27C]">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-8 h-8 border-2 border-[#C8A27C] mb-2 flex items-center justify-center rounded-full border-t-transparent animate-spin"></div>
           <p className="text-xs tracking-widest uppercase">Verificando segurança...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
