import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { TenantGrowthChart } from '../../components/charts/TenantGrowthChart';
import { RevenueLineChart } from '../../components/charts/RevenueLineChart';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export function StatistikPage() {
  return (
    <div className="statistik-page">
      <PageHeader
        title="Statistik Platform & Growth MRR"
        description="Metrik pertumbuhan bisnis SaaS Rentra secara real-time."
      />

      <div className="kpi-grid">
        <StatCard title="MRR (Monthly Recurring Revenue)" value="Rp 45.000.000" icon={DollarSign} color="success" />
        <StatCard title="ARR (Annual Run Rate)" value="Rp 540.000.000" icon={TrendingUp} color="primary" />
        <StatCard title="Churn Rate" value="1.2%" icon={Activity} color="warning" subtext="Sangat rendah" />
        <StatCard title="Net Tenant Retention" value="98.8%" icon={Users} color="info" />
      </div>

      <div className="dashboard-two-col margin-top-lg">
        <div className="card">
          <div className="card-header-flex">
            <h3>Pertumbuhan Tenant Baru (Monthly)</h3>
          </div>
          <TenantGrowthChart />
        </div>

        <div className="card">
          <div className="card-header-flex">
            <h3>Pendapatan MRR Platform 30 Hari</h3>
          </div>
          <RevenueLineChart />
        </div>
      </div>
    </div>
  );
}
