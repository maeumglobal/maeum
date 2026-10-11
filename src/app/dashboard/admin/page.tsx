'use client';

/**
 * Painel administrativo (`/dashboard/admin`).
 *
 * ## Autorização
 *
 * Não há checagem de papel AQUI de propósito — o layout
 * (`src/app/dashboard/layout.tsx`) resolve a sessão no servidor e o
 * `DashboardShell`/`AdminGuard` bloqueiam a renderização para quem não tem o
 * papel. Cada aba, por sua vez, chama uma server action que revalida
 * `requireAdmin()` no Postgres. Duplicar o guard na página só criaria duas
 * fontes de verdade para a mesma decisão.
 *
 * ## Por que a aba vive em estado local
 *
 * As 12 telas são componentes de painel, não rotas: cada uma já busca, filtra,
 * pagina e grava. Promovê-las a rotas mudaria o contrato de 12 componentes que
 * não são deste arquivo. A URL não carrega a aba de propósito — evita
 * `useSearchParams` (e o `<Suspense>` correspondente) por causa de estado que é
 * deliberadamente efêmero.
 *
 * Esta página tem shell próprio (`AdminSidebar` + `AdminHeader` full-screen);
 * por isso o `DashboardShell` não desenha sidebar/header aqui.
 */
import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

import AdminDashboardHome from '@/components/admin/dashboard/AdminDashboardHome';
import AdminLeadsHome from '@/components/admin/leads/AdminLeadsHome';
import AdminUsersHome from '@/components/admin/users/AdminUsersHome';
import AdminBookingsHome from '@/components/admin/bookings/AdminBookingsHome';
import AdminJourneysHome from '@/components/admin/journeys/AdminJourneysHome';
import AdminExperiencesHome from '@/components/admin/experiences/AdminExperiencesHome';
import AdminCategoriesHome from '@/components/admin/experiences/AdminCategoriesHome';
import AdminBlogHome from '@/components/admin/content/AdminBlogHome';
import AdminTestimonialsFaqHome from '@/components/admin/content/AdminTestimonialsFaqHome';
import AdminLogsHome from '@/components/admin/logs/AdminLogsHome';
import AdminSiteConfigHome from '@/components/admin/config/AdminSiteConfigHome';
import AdminSiteContentHome from '@/components/admin/content/AdminSiteContentHome';
import AdminPackagesHome from '@/components/admin/packages/AdminPackagesHome';
import AdminPartnersHome from '@/components/admin/partners/AdminPartnersHome';
import AdminProposalsHome from '@/components/admin/proposals/AdminProposalsHome';
import AdminExchangeHome from '@/components/admin/exchange/AdminExchangeHome';
import AdminNavigationHome from '@/components/admin/navigation/AdminNavigationHome';
import AdminKbeautyHome from '@/components/admin/kbeauty/AdminKbeautyHome';
import AdminCmsPagesHome from '@/components/admin/cms/AdminCmsPagesHome';

/** Ids das abas. `undefined` = nenhuma tela montada (nunca renderizado). */
type AdminTab =
  | 'dashboard_home'
  | 'leads'
  | 'users'
  | 'reservas'
  | 'propostas'
  | 'jornadas'
  | 'experiencias'
  | 'kbeauty'
  | 'categorias'
  | 'pacotes'
  | 'parceiros'
  | 'intercambio'
  | 'blog'
  | 'depoimentos_faq'
  | 'paginas'
  | 'logs'
  | 'sitecontent'
  | 'visual'
  | 'navegacao';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard_home');

  return (
    <div className="admin-dashboard flex h-dvh w-full bg-[var(--admin-bg)] overflow-hidden font-sans">
      <AdminSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AdminTab)} />

      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader />

        <main className="no-scrollbar relative min-w-0 w-full flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard_home' && <AdminDashboardHome />}
          {activeTab === 'leads' && <AdminLeadsHome />}
          {activeTab === 'users' && <AdminUsersHome />}
          {activeTab === 'reservas' && <AdminBookingsHome />}
          {activeTab === 'propostas' && <AdminProposalsHome />}
          {activeTab === 'jornadas' && <AdminJourneysHome />}
          {activeTab === 'experiencias' && <AdminExperiencesHome />}
          {activeTab === 'kbeauty' && <AdminKbeautyHome />}
          {activeTab === 'categorias' && <AdminCategoriesHome />}
          {activeTab === 'pacotes' && <AdminPackagesHome />}
          {activeTab === 'parceiros' && <AdminPartnersHome />}
          {activeTab === 'intercambio' && <AdminExchangeHome />}
          {activeTab === 'blog' && <AdminBlogHome />}
          {activeTab === 'depoimentos_faq' && <AdminTestimonialsFaqHome />}
          {activeTab === 'paginas' && <AdminCmsPagesHome />}
          {activeTab === 'logs' && <AdminLogsHome />}
          {activeTab === 'sitecontent' && <AdminSiteContentHome />}
          {activeTab === 'visual' && <AdminSiteConfigHome />}
          {activeTab === 'navegacao' && <AdminNavigationHome />}
        </main>
      </div>
    </div>
  );
}