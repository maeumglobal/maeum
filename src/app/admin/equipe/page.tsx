import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import EquipeClient from './EquipeClient';
import { buildNoIndexMetadata } from '@/lib/seo';
import { getAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/session';

export const metadata: Metadata = buildNoIndexMetadata('Equipe | Maeum Global', '/admin/equipe');

/**
 * Gestão de acessos é exclusiva de super_admin/admin.
 *
 * Antes esta tela só contava com o `AdminGuard` (client-side), e o `proxy.ts`
 * libera `/admin/*` para qualquer pessoa da equipe — uma consultora conseguia
 * abrir esta página e ver a lista de usuários. A checagem precisa acontecer no
 * servidor, junto com o dado.
 */
export default async function AdminEquipePage() {
  const auth = await getAuth();
  if (!auth) redirect('/login?next=%2Fadmin%2Fequipe');
  if (!isAdmin(auth.user.role)) redirect('/dashboard/consultora');

  return <EquipeClient />;
}
