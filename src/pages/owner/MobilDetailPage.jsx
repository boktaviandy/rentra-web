import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { ArrowLeft, Calendar, DollarSign, Wrench, Clock, FileText, Car } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { getFotoSrc } from '../../hooks/useFotoLibrary';
import './MobilDetailPage.css';

export function MobilDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: mobilData } = useStore('mobil');
  const { data: bookingData } = useStore('booking');
  const { data: pengeluaranData } = useStore('pengeluaran');

  const mobil = mobilData.find((m) => m.id === id);

  if (!mobil) {
    return (
      <div className="mobil-detail-page">
        <div className="back-link" onClick={() => navigate('/mobil')}>
          <ArrowLeft size={16} /> Kembali ke Daftar Mobil
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3>Data Mobil Tidak Ditemukan</h3>
          <p className="subtext" style={{ margin: '8px 0 16px' }}>Mobil dengan ID ini belum terdaftar atau telah dihapus.</p>
          <button className="btn btn-primary" onClick={() => navigate('/mobil')}>
            Ke Halaman Mobil
          </button>
        </div>
      </div>
    );
  }

  const heroImgSrc = getFotoSrc(mobil.foto);

  // Riwayat filtering for this car
  const riwayatBooking = bookingData.filter((b) => b.mobilId === mobil.id);
  const riwayatServis = pengeluaranData.filter((p) => p.mobilId === mobil.id || p.mobilNama?.includes(mobil.nama));

  return (
    <div className="mobil-detail-page">
      <div className="back-link" onClick={() => navigate('/mobil')}>
        <ArrowLeft size={16} /> Kembali ke Daftar Mobil
      </div>

      <PageHeader
        title={mobil.nama}
        description={`Plat Nomor: ${mobil.plat} • ${mobil.merk} (${mobil.tahun})`}
        action={
          <Badge variant={getStatusBadgeVariant(mobil.status)}>
            {mobil.status}
          </Badge>
        }
      />


      {/* Main Info Card */}
      <div className="mobil-hero-card card">
        <div className="hero-img-box">
          {heroImgSrc ? (
            <img
              src={heroImgSrc}
              alt={mobil.nama}
              className="hero-img"
              onError={(e) => {
                e.target.style.display = 'none';
                const sibling = e.target.parentElement.querySelector('.hero-img-placeholder');
                if (sibling) sibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`hero-img-placeholder ${heroImgSrc ? 'hidden-placeholder' : ''}`}>
            <Car size={44} className="hero-placeholder-icon" />
            <span>Foto Belum Ditambahkan</span>
          </div>
        </div>
        <div className="hero-details">
          <div className="price-grid">
            <div className="price-item">
              <span className="price-label">Harian</span>
              <span className="price-val">Rp {Number(mobil.hargaHarian || mobil.hargaSewa || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="price-item">
              <span className="price-label">Mingguan</span>
              <span className="price-val">Rp {Number(mobil.hargaMingguan).toLocaleString('id-ID')}</span>
            </div>
            <div className="price-item">
              <span className="price-label">Bulanan</span>
              <span className="price-val">Rp {Number(mobil.hargaBulanan).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="catatan-box">
            <h4>Catatan & Spesifikasi</h4>
            <p>{mobil.catatan}</p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid margin-top-lg">
        <StatCard
          title="Total Hari Disewa"
          value={`${mobil.totalHariDisewa} Hari`}
          icon={Clock}
          color="primary"
        />
        <StatCard
          title="Total Pendapatan Mobil"
          value={`Rp ${Number(mobil.totalPendapatan).toLocaleString('id-ID')}`}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Total Servis & Pemeliharaan"
          value={`Rp ${riwayatServis.reduce((sum, s) => sum + s.nominal, 0).toLocaleString('id-ID')}`}
          icon={Wrench}
          color="warning"
        />
      </div>

      {/* Tab Sections: Riwayat Booking & Servis */}
      <div className="detail-tabs-grid margin-top-lg">
        {/* Riwayat Booking */}
        <div className="card">
          <div className="card-header-flex">
            <h3><FileText size={18} /> Riwayat Booking</h3>
          </div>
          {riwayatBooking.length > 0 ? (
            <div className="riwayat-list">
              {riwayatBooking.map((b) => (
                <div key={b.id} className="riwayat-item">
                  <div>
                    <div className="riwayat-title">{b.customerNama}</div>
                    <div className="riwayat-sub">{b.tglMulai} s/d {b.tglSelesai}</div>
                  </div>
                  <div className="riwayat-right">
                    <span className="riwayat-price">Rp {b.harga.toLocaleString('id-ID')}</span>
                    <Badge variant={getStatusBadgeVariant(b.status)}>{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Belum ada riwayat booking untuk mobil ini.</p>
          )}
        </div>

        {/* Riwayat Servis */}
        <div className="card">
          <div className="card-header-flex">
            <h3><Wrench size={18} /> Riwayat Servis & Maintenance</h3>
          </div>
          {riwayatServis.length > 0 ? (
            <div className="riwayat-list">
              {riwayatServis.map((s) => (
                <div key={s.id} className="riwayat-item">
                  <div>
                    <div className="riwayat-title">{s.kategori} - {s.tanggal}</div>
                    <div className="riwayat-sub">{s.catatan}</div>
                  </div>
                  <div className="riwayat-right">
                    <span className="riwayat-price text-danger">
                      -Rp {s.nominal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Belum ada riwayat servis untuk mobil ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
