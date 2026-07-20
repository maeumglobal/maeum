'use client';

import React from 'react';
import DashboardMetrics from './DashboardMetrics';
import RevenueChart from './RevenueChart';
import BookingsChart from './BookingsChart';
import BookingsStatus from './BookingsStatus';
import RecentConsultations from './RecentConsultations';
import RecentPayments from './RecentPayments';
import PaymentLinkGenerator from './PaymentLinkGenerator';
import FinancialSummary from './FinancialSummary';
import { motion } from 'framer-motion';
import { getDashboardData } from '@/actions/dashboardActions';
import { RefreshCw } from 'lucide-react';

export default function AdminDashboardHome() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      const res = await getDashboardData();
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 w-full min-w-0 flex-1"
    >
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
          <RecentConsultations consultations={data?.recentConsultations} />
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
