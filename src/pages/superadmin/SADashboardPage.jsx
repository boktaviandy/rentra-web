import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { TenantGrowthChart } from '../../components/charts/TenantGrowthChart';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Building2, CheckCircle2, Clock, AlertTriangle, DollarSign, CreditCard } from 'lucide-react';
import tenantData from '../../data/tenant.json';
import { useNavigate } from 'react-router-dom';

export function SADashboardPage() {
  const navigate = useNavigate();

  const totalTenant = tenantData.length;
  const tenantAktif = tenantData.filter((t) => t.status === 'Aktif').length;
  const tenantTrial = tenantData.filter((t) => t.status === 'Trial').length;
  const tenantExpired = tenantData.filter((t) => t.status === 'Expired').length;

  return (
    <div className="sa-dashboard-page">
      <PageHeader
        title="Super Admin Dashboard"
        description="Ringkasan ekosistem platform SaaS Rentra."
      />

      <div className="kpi-grid">
        <StatCard
          title="Total Tenant"
          value={totalTenant}
          icon={Building2}
          color="primary"
        />
        <StatCard
          title="Tenant Aktif"
          value={tenantAktif}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Tenant Trial"
          value={tenantTrial}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Tenant Expired"
          value={tenantExpired}
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="MRR (Pendapatan Bulanan)"
          value="Rp 45.000.000"
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Total Transaksi SaaS"
          value="128"
          icon={CreditCard}
          color="info"
        />
      </div>

      <div className="card margin-top-lg">
        <div className="card-header-flex">
          <h3>Pertumbuhan Tenant Baru</h3>
        </div>
        <TenantGrowthChart />
      </div>

      <div className="card margin-top-lg">
        <div className="card-header-flex">
          <h3>Tenant Terbaru Bergabung</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/superadmin/tenant')}>
            Kelola Tenant
          </button>
        </div>
        <div className="recent-list">
          {tenantData.map((t) => (
            <div key={t.id} className="recent-item">
              <div>
                <div className="font-medium">{t.namaRental} ({t.namaOwner})</div>
                <div className="subtext">{t.email} • Paket: {t.paket}</div>
              </div>
              <Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
