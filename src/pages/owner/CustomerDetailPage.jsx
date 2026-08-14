import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { ArrowLeft, User, Phone, MapPin, FileCheck, History } from 'lucide-react';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { useStore } from '../../hooks/useStore';

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customerData } = useStore('customer');
  const { data: bookingData } = useStore('booking');

  const customer = customerData.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="customer-detail-page">
        <div className="back-link" onClick={() => navigate('/customer')}>
          <ArrowLeft size={16} /> Kembali ke Daftar Customer
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3>Data Pelanggan Tidak Ditemukan</h3>
          <p className="subtext" style={{ margin: '8px 0 16px' }}>Pelanggan dengan ID ini belum terdaftar atau telah dihapus.</p>
          <button className="btn btn-primary" onClick={() => navigate('/customer')}>
            Ke Halaman Customer
          </button>
        </div>
      </div>
    );
  }

  const riwayat = bookingData.filter((b) => b.customerId === customer.id);

  return (
    <div className="customer-detail-page">
      <div className="back-link" onClick={() => navigate('/customer')}>
        <ArrowLeft size={16} /> Kembali ke Daftar Customer
      </div>

      <PageHeader
        title={customer.nama}
        description={`ID Pelanggan: ${customer.id}`}
      />


      <div className="dashboard-two-col">
        {/* Info Bio & Foto Dokumen */}
        <div className="col-stack">
          <div className="card">
            <div className="card-header-flex">
              <h3><User size={18} /> Profil & Kontak</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div><strong>No HP:</strong> {customer.noHp}</div>
              <div><strong>No KTP:</strong> {customer.noKtp}</div>
              <div><strong>No SIM:</strong> {customer.noSim}</div>
              <div><strong>Alamat:</strong> {customer.alamat}</div>
              <div><strong>Catatan:</strong> {customer.catatan}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header-flex">
              <h3><FileCheck size={18} /> Foto KTP & SIM</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span className="subtext">Foto KTP</span>
                <img src={customer.fotoKtp} alt="KTP" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '6px' }} />
              </div>
              <div>
                <span className="subtext">Foto SIM</span>
                <img src={customer.fotoSim} alt="SIM" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '6px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Booking */}
        <div className="card">
          <div className="card-header-flex">
            <h3><History size={18} /> Riwayat Booking</h3>
          </div>
          {riwayat.length > 0 ? (
            <div className="riwayat-list">
              {riwayat.map((b) => (
                <div key={b.id} className="riwayat-item">
                  <div>
                    <div className="riwayat-title">{b.mobilNama}</div>
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
            <p className="empty-text">Belum ada riwayat booking untuk pelanggan ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
