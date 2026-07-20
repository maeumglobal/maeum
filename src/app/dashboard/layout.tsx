'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_ROUTES: Record<string, string> = {
  super_admin: '/dashboard/admin',
  admin: '/dashboard/admin',
  manager: '/dashboard/admin',
  editor: '/dashboard/admin',
  consultora: '/dashboard/consultora',
  customer: '/dashboard/cliente'
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const allowedRoute = ROLE_ROUTES[user?.role || ''];
    if (allowedRoute && pathname !== allowedRoute && (pathname === '/dashboard' || !Object.values(ROLE_ROUTES).includes(pathname))) {
      router.push(allowedRoute);
      return;
    }

    setChecked(true);
  }, [user, loading, isAuthenticated, router, pathname]);

  if (loading || !checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold tracking-wider uppercase">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
