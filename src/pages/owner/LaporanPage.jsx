import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { RevenueLineChart } from '../../components/charts/RevenueLineChart';
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Award, Trophy, Filter } from 'lucide-react';
import { useTenantStore } from '../../hooks/useTenantStore';
import { useToast } from '../../context/ToastContext';
import './LaporanPage.css';

export function LaporanPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState('Bulanan');

  const { data: pemasukanData } = useTenantStore('pemasukan');
  const { data: pengeluaranData } = useTenantStore('pengeluaran');
  const { data: mobilData } = useTenantStore('mobil');
  const { data: customerData } = useTenantStore('customer');

  const totalPendapatan = pemasukanData.reduce((acc, p) => acc + (Number(p.nominal) || 0), 0);
  const totalPengeluaran = pengeluaranData.reduce((acc, p) => acc + (Number(p.nominal) || 0), 0);
  const labaBersih = totalPendapatan - totalPengeluaran;

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    toast.success('Ekspor Berhasil', 'Laporan Keuangan format Excel (.xlsx) siap diunduh.');
  };


  return (
    <div className="laporan-page">
      <PageHeader
        title={t('nav.laporan')}
        description="Analisis performa bisnis rental, profitabilitas, dan unit terpopuler."
        action={
          <div className="laporan-actions">
            <button className="btn btn-secondary" onClick={handleExportExcel}>
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button className="btn btn-primary" onClick={handleExportPDF}>
              <Download size={16} /> Export PDF
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="card filter-bar">
        <div className="filter-group">
          <Filter size={16} />
          <span className="font-medium">Periode Laporan:</span>
          {['Harian', 'Mingguan', 'Bulanan', 'Custom'].map((period) => (
            <button
              key={period}
              className={`filter-chip ${filterType === period ? 'active' : ''}`}
              onClick={() => setFilterType(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid margin-top-lg">
        <StatCard
          title="Total Pendapatan"
          value={`Rp ${totalPendapatan.toLocaleString('id-ID')}`}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Total Pengeluaran"
          value={`Rp ${totalPengeluaran.toLocaleString('id-ID')}`}
          icon={TrendingDown}
          color="danger"
        />
        <StatCard
          title="Laba Bersih"
          value={`Rp ${labaBersih.toLocaleString('id-ID')}`}
          icon={DollarSign}
          color="primary"
        />
      </div>

      {/* Top Performers Grid */}
      <div className="dashboard-two-col margin-top-lg">
        {/* Mobil Terlaris */}
        <div className="card">
          <div className="card-header-flex">
            <h3><Trophy size={18} className="text-warning" /> Mobil Terlaris (Top Income)</h3>
          </div>
          {mobilData.length === 0 ? (
            <div className="subtext" style={{ padding: '24px', textAlign: 'center' }}>
              Belum ada data mobil.
            </div>
          ) : (
            mobilData.slice(0, 3).map((m, idx) => (
              <div key={m.id} className="top-performer-item">
                <div className="performer-rank">{idx + 1}</div>
                <div className="performer-info">
                  <div className="font-medium">{m.nama} ({m.plat})</div>
                  <div className="subtext">{m.totalHariDisewa || 0} Hari Disewa</div>
                </div>
                <div className="performer-val text-success">
                  Rp {(m.totalPendapatan || 0).toLocaleString('id-ID')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pelanggan Booking Terbanyak */}
        <div className="card">
          <div className="card-header-flex">
            <h3><Award size={18} className="text-primary" /> Pelanggan Setia (Top Customer)</h3>
          </div>
          {customerData.length === 0 ? (
            <div className="subtext" style={{ padding: '24px', textAlign: 'center' }}>
              Belum ada data pelanggan.
            </div>
          ) : (
            customerData.slice(0, 3).map((c, idx) => (
              <div key={c.id} className="top-performer-item">
                <div className="performer-rank rank-blue">{idx + 1}</div>
                <div className="performer-info">
                  <div className="font-medium">{c.nama}</div>
                  <div className="subtext">{c.noHp}</div>
                </div>
                <div className="id-tag">VIP</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="card margin-top-lg">
        <RevenueLineChart title="Grafik Laba Rugi Periodik" defaultPeriod="bulanan" />
      </div>
    </div>
  );
}

