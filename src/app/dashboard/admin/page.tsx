'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

// New Prisma-backed Admin Components
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

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState('dashboard_home');
  const { user } = useAuth();

  return (
    <div className="admin-dashboard flex h-screen w-screen bg-[var(--admin-bg)] overflow-hidden font-sans">
      <AdminSidebar activeTab={activeSubTab} onTabChange={setActiveSubTab} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar min-w-0 w-full relative">
          {activeSubTab === 'dashboard_home' && <AdminDashboardHome />}
          {activeSubTab === 'leads' && <AdminLeadsHome />}
          {activeSubTab === 'users' && <AdminUsersHome />}
          {activeSubTab === 'reservas' && <AdminBookingsHome />}
          {activeSubTab === 'jornadas' && <AdminJourneysHome />}
          {activeSubTab === 'experiencias' && <AdminExperiencesHome />}
          {activeSubTab === 'categorias' && <AdminCategoriesHome />}
          {activeSubTab === 'blog' && <AdminBlogHome />}
          {activeSubTab === 'depoimentos_faq' && <AdminTestimonialsFaqHome />}
          {activeSubTab === 'logs' && <AdminLogsHome />}
          {activeSubTab === 'visual' && <AdminSiteConfigHome />}
        </main>
      </div>
    </div>
  );
}
