'use client';

import React, { useState, useEffect } from 'react';
import DashboardMetrics from './DashboardMetrics';
import RevenueChart from './RevenueChart';
import BookingsChart from './BookingsChart';
import BookingsStatus from './BookingsStatus';
import RecentConsultations from './RecentConsultations';
import RecentPayments from './RecentPayments';
import PaymentLinkGenerator from './PaymentLinkGenerator';
import FinancialSummary from './FinancialSummary';
import { motion } from 'framer-motion';
import { getAdminStats } from '@/actions/adminActions';
import { RefreshCw, LayoutDashboard } from 'lucide-react';

export default function AdminDashboardHome() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await getAdminStats();
      if (res.success) setData(res.data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[50vh] text-[var(--admin-text-muted)]">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--admin-primary)] mb-4" />
        <p>Carregando métricas em tempo real...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-[var(--admin-primary)]" /> Visão Geral do Sistema
        </h2>
        <p className="text-xs text-[var(--admin-text-muted)]">Métricas e performance em tempo real</p>
      </div>

      {/* Row 1: Metrics */}
      <DashboardMetrics metrics={data?.metrics} />

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 min-w-0">
          <RevenueChart />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <BookingsChart />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <BookingsStatus />
        </div>
      </div>

      {/* Row 3: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 min-w-0">
          <RecentConsultations consultations={data?.recentLeads} />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <RecentPayments payments={data?.recentPayments} />
        </div>
        <div className="lg:col-span-1 min-w-0">
          <PaymentLinkGenerator />
        </div>
      </div>

      {/* Row 4: Summary */}
      <FinancialSummary />
    </motion.div>
  );
}
