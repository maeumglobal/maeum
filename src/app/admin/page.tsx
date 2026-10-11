import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo';

/**
 * `/admin` não tem tela própria: o painel operacional completo vive em
 * `/dashboard/admin` (é lá que ficam CRM, reservas, catálogo, CMS e logs).
 * O layout de `/admin/*` continua protegendo a rota antes deste redirect.
 */
export const metadata: Metadata = buildNoIndexMetadata('Painel | Maeum Global', '/admin');

export default function AdminRootPage() {
  redirect('/dashboard/admin');
}
