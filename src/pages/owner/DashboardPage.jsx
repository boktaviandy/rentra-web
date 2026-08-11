import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  Car,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  ArrowUpRight,
  Eye,
  Plus
} from 'lucide-react';
import { useTenantStore } from '../../hooks/useTenantStore';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTenant } = useAuth();

  const { data: mobilData } = useTenantStore('mobil');
  const { data: bookingData } = useTenantStore('booking');
  const { data: pemasukanData } = useTenantStore('pemasukan');
  const { data: pengeluaranData } = useTenantStore('pengeluaran');

  // Metrics computation from data
  const totalMobil = mobilData.length;
  const mobilDisewa = mobilData.filter((m) => {
    if (m.status === 'Disewa') return true;
    return (bookingData || []).some(
      (b) => b.mobilId === m.id && (b.status === 'Berjalan' || b.status === 'Booking')
    );
  }).length;
  const occupancyRate = totalMobil > 0 ? Math.round((mobilDisewa / totalMobil) * 100) : 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentMonthLabel = `${monthNames[currentMonth]} ${currentYear}`;

  const isCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  };

  const totalPemasukanBulanIni = pemasukanData
    .filter((p) => isCurrentMonth(p.tanggal || p.created_at))
    .reduce((acc, p) => acc + (Number(p.nominal) || 0), 0);

  const totalPengeluaranBulanIni = pengeluaranData
    .filter((p) => isCurrentMonth(p.tanggal || p.created_at))
    .reduce((acc, p) => acc + (Number(p.nominal) || 0), 0);

  const labaBersihBulanIni = totalPemasukanBulanIni - totalPengeluaranBulanIni;

  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const bookingHariIni = bookingData.filter((b) => b.tglMulai === todayStr).length;
  const bookingBesok = bookingData.filter((b) => b.tglMulai === tomorrowStr).length;

  const mobilKembaliHariIni = bookingData
    .filter((b) => b.tglSelesai === todayStr)
    .map((b) => ({ plat: b.mobilPlat, mobil: b.mobilNama, customer: b.customerNama, jam: '17:00 WIB' }));

  const recentBookings = bookingData.slice(0, 8);

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t('nav.dashboard')}
        description={`Selamat datang di ${currentTenant?.namaRental || 'Rentra'}! Ringkasan operasional dan keuangan rental Anda.`}
        action={
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/booking')}>
            <Plus size={15} />
            Tambah Booking
          </button>
        }
      />

      {/* KPI Cards Grid (Compact) */}
      <div className="kpi-grid">
        <StatCard
          title={t('dashboard.total_mobil')}
          value={totalMobil}
          icon={Car}
          color="primary"
          subtext="Semua unit garasi"
        />
        <StatCard
          title={t('dashboard.mobil_disewa')}
          value={mobilDisewa}
          icon={CheckCircle2}
          color="info"
          subtext={`${occupancyRate}% okupansi`}
        />
        <StatCard
          title={t('dashboard.pendapatan_bulan_ini')}
          value={`Rp ${totalPemasukanBulanIni.toLocaleString('id-ID')}`}
          icon={TrendingUp}
          color="success"
          subtext={currentMonthLabel}
        />
        <StatCard
          title={t('dashboard.pengeluaran_bulan_ini')}
          value={`Rp ${totalPengeluaranBulanIni.toLocaleString('id-ID')}`}
          icon={TrendingDown}
          color="danger"
          subtext={currentMonthLabel}
        />
        <StatCard
          title={t('dashboard.laba_bersih')}
          value={`Rp ${labaBersihBulanIni.toLocaleString('id-ID')}`}
          icon={DollarSign}
          color="warning"
          subtext={currentMonthLabel}
        />
        <StatCard
          title={t('dashboard.booking_hari_ini')}
          value={bookingHariIni}
          icon={Calendar}
          color="primary"
          subtext="Penyerahan unit"
        />
        <StatCard
          title={t('dashboard.booking_besok')}
          value={bookingBesok}
          icon={Clock}
          color="secondary"
          subtext="Persiapan esok hari"
        />
      </div>

      {/* Operasional Hari Ini & Booking Terbaru */}
      <div className="dashboard-content-grid margin-top-md">
        {/* Mobil Kembali Hari Ini Column */}
        <div className="card dashboard-card returns-card">
          <div className="card-header flex-between">
            <h3 className="card-title">{t('dashboard.mobil_kembali_hari_ini')}</h3>
            <span className="badge badge-warning">{mobilKembaliHariIni.length} Unit</span>
          </div>

          <div className="returns-list">
            {mobilKembaliHariIni.length === 0 ? (
              <p className="subtext empty-returns-text">
                Tidak ada jadwal pengembalian mobil hari ini.
              </p>
            ) : (
              mobilKembaliHariIni.map((item, idx) => (
                <div key={idx} className="return-item">
                  <div className="return-icon-box">
                    <Clock size={16} />
                  </div>
                  <div className="return-info">
                    <div className="return-title">{item.mobil}</div>
                    <div className="return-sub">
                      {item.plat} • {item.customer}
                    </div>
                  </div>
                  <div className="return-time">{item.jam}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings Table Column */}
        <div className="card dashboard-card bookings-card">
          <div className="card-header flex-between">
            <h3 className="card-title">{t('dashboard.booking_terbaru')}</h3>
            <button className="btn btn-secondary btn-sm btn-see-all" onClick={() => navigate('/booking')}>
              <span>Lihat Semua<span className="hide-mobile"> Booking</span></span> <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pelanggan</th>
                  <th>Mobil</th>
                  <th>Tanggal Sewa</th>
                  <th>Total Biaya</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)' }}>
                      Belum ada transaksi booking tercatat.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <span className="id-tag">{b.id}</span>
                      </td>
                      <td className="font-medium">{b.customerNama}</td>
                      <td>
                        <div className="font-medium">{b.mobilNama}</div>
                        <div className="subtext">{b.mobilPlat}</div>
                      </td>
                      <td>
                        <div className="font-medium">{b.tglMulai} s/d {b.tglSelesai}</div>
                        <div className="subtext">{b.totalHari || 1} Hari</div>
                      </td>
                      <td className="font-semibold">
                        Rp {Number(b.harga || b.totalHarga || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(b.status)}>{b.status}</Badge>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Lihat Detail"
                          onClick={() => navigate(`/booking/${b.id}`)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


